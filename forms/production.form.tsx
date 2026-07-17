"use client"

import * as React from "react"
import { useForm, useStore } from "@tanstack/react-form"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  AlertCircle,
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  ShoppingCart,
  Trash2,
  Undo2,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"

import {
  createProduction,
  getProduction,
  updateProduction,
  checkExistingProduction,
} from "./queries/production.query"
import { searchProductionAreas } from "./queries/production_area.query"
import { searchProductionLines } from "./queries/production_line.query"
import { searchSkus } from "./queries/sku.query"
import {
  productionSchema,
  type ProductionFormValues,
} from "./schemas/production.schema"

export function ProductionForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()
  const queryClient = useQueryClient()

  const [isMounted, setIsMounted] = React.useState(false)
  const [dateBounds, setDateBounds] = React.useState({ min: "", max: "" })

  const [selectedSku, setSelectedSku] = React.useState<string>("")
  const [qtyInput, setQtyInput] = React.useState<number | "">(1)
  const [cartError, setCartError] = React.useState<string | null>(null)
  const [openSkuPopover, setOpenSkuPopover] = React.useState(false)
  const [skuSearchQuery, setSkuSearchQuery] = React.useState("")

  const [mergedRecordId, setMergedRecordId] = React.useState<string | null>(
    null
  )

  let id = params?.id as string | undefined
  if (editId) id = editId
  const isEditMode = !!id

  React.useEffect(() => {
    setIsMounted(true)

    // Calculate Date Bounds: Yesterday allowed only before 11:00 AM
    const now = new Date()
    const currentHour = now.getHours()

    const toYMD = (d: Date) => {
      const offset = d.getTimezoneOffset() * 60000
      return new Date(d.getTime() - offset).toISOString().split("T")[0]
    }

    const todayStr = toYMD(now)
    const yesterday = new Date(now)
    yesterday.setDate(now.getDate() - 1)
    const yesterdayStr = toYMD(yesterday)

    setDateBounds({
      min: currentHour < 11 ? yesterdayStr : todayStr,
      max: todayStr,
    })
  }, [])

  const { data: areaOptions = [], isLoading: isLoadingAreas } = useQuery({
    queryKey: ["production_areas_options"],
    queryFn: () => searchProductionAreas(""),
  })

  const { data: lineOptions = [], isLoading: isLoadingLines } = useQuery({
    queryKey: ["production_lines_options"],
    queryFn: () => searchProductionLines(""),
  })

  const { data: skuOptions = [], isLoading: isLoadingSkus } = useQuery({
    queryKey: ["sku_options", skuSearchQuery],
    queryFn: () => searchSkus(skuSearchQuery),
  })

  const { data: productionData, isLoading: isLoadingProduction } = useQuery({
    queryKey: ["productions", id],
    queryFn: () => getProduction(id!),
    enabled: isEditMode,
  })

  const mutation = useMutation({
    mutationFn: ({
      effectiveId,
      ...values
    }: ProductionFormValues & { effectiveId?: string }) => {
      if (effectiveId) {
        return updateProduction({ ...values, id: effectiveId })
      }
      return createProduction(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productions"] })
      form.reset()
      if (onClose) onClose()
    },
  })

  const form = useForm({
    defaultValues: {
      production_date: productionData?.production_date ?? "",
      production_area_id: productionData?.production_area_id
        ? String(productionData.production_area_id)
        : "",
      production_line_id: productionData?.production_line_id
        ? String(productionData.production_line_id)
        : "",
      shift: (productionData?.shift as "day" | "night") ?? "day",
      operation_type:
        (productionData?.operation_type as
          "startup" | "last_prod" | "regular") ?? "regular",
      items:
        (productionData?.items as {
          sku_id: string | number
          sku_code?: string
          qty: number
          uom?: string
        }[]) ?? [],
    },
    validators: {
      onSubmit: productionSchema,
    },
    onSubmit: async ({ value }) => {
      const effectiveId = isEditMode ? id : existingData?.id
      // Clean the payload: remove `sku_code` so we only send what the DB expects
      const cleanedItems = value.items.map(({ sku_id, qty, uom }) => ({
        sku_id,
        qty,
        uom,
      }))
      mutation.mutate({ ...value, items: cleanedItems, effectiveId } as any)
    },
  })

  const {
    production_date,
    production_area_id,
    production_line_id,
    shift,
    operation_type,
  } = useStore(form.store, (state) => state.values)

  const { data: existingData, isLoading: isCheckingExisting } = useQuery({
    queryKey: [
      "check_production",
      production_date,
      production_area_id,
      production_line_id,
      shift,
      operation_type,
    ],
    queryFn: async () => {
      try {
        const response = await checkExistingProduction({
          production_date,
          production_area: production_area_id,
          production_line: production_line_id,
          production_area_id: production_area_id,
          production_line_id: production_line_id,
          shift,
          operation_type,
        } as any)

        return response
      } catch (error) {
        console.warn("No existing production found or check failed:", error)
        return null
      }
    },
    enabled: !!(
      production_date &&
      production_area_id &&
      production_line_id &&
      shift &&
      operation_type &&
      !isEditMode
    ),
  })

  // Synchronize DB baseline data directly into the active local form items array
  React.useEffect(() => {
    if (existingData && !isEditMode && existingData.id !== mergedRecordId) {
      const currentItems = form.getFieldValue("items") || []

      const merged = existingData.items.map((exItem: any) => {
        const exSkuId = exItem.sku_id || exItem.sku
        const exQty = Number(exItem.qty || exItem.quantity)
        const exSkuCode = exItem.sku_code || exItem.sku?.sku_code || exSkuId

        const curr = currentItems.find(
          (c) => String(c.sku_id) === String(exSkuId)
        )
        return {
          sku_id: exSkuId as string | number, // Fixed type
          sku_code: exSkuCode as string,
          qty: Math.max(exQty, exQty + (curr ? Number(curr.qty) : 0)),
          uom: exItem.uom as string | undefined,
        }
      })

      currentItems.forEach((curr) => {
        if (
          !existingData.items.find(
            (ex: any) => String(ex.sku_id || ex.sku) === String(curr.sku_id)
          )
        ) {
          merged.push(curr)
        }
      })

      form.setFieldValue("items", merged)
      setMergedRecordId(existingData.id)
    }
  }, [existingData, isEditMode, mergedRecordId, form])

  React.useEffect(() => {
    if (productionData && isEditMode) {
      form.reset({
        production_date: productionData.production_date ?? "",
        production_area_id: productionData.production_area_id
          ? String(productionData.production_area_id)
          : "",
        production_line_id: productionData.production_line_id
          ? String(productionData.production_line_id)
          : "",
        shift: (productionData.shift as "day" | "night") ?? "day",
        operation_type:
          (productionData.operation_type as
            "startup" | "last_prod" | "regular") ?? "regular",
        items:
          (productionData.items as any[])?.map((item) => ({
            sku_id: item.sku_id as string | number, // Fixed type
            sku_code: (item.sku_code ||
              item.sku?.sku_code ||
              item.sku_id) as string,
            qty: item.qty,
            uom: item.uom,
          })) ?? [],
      })
    }
  }, [productionData, form, isEditMode])

  if (isEditMode && isLoadingProduction) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading production details...
      </div>
    )
  }

  const baselineItems =
    (isEditMode ? productionData?.items : existingData?.items) || []

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {/* HEADER NOTIFICATION */}
      {existingData && !isEditMode && (
        <div className="flex items-start gap-3 rounded-md border border-blue-200 bg-blue-50 p-4 text-blue-800">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Existing Log Found</p>
            <p className="mt-1 opacity-90">
              Matches an existing entry. The database baseline records are
              listed below. Use the lookup bar to append quantities or register
              new items.
            </p>
          </div>
        </div>
      )}

      {/* COMPOSITE KEY SELECTORS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="production_date">
          {(field) => (
            <Field>
              <FieldLabel>
                Production Date <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                type="date"
                min={dateBounds.min}
                max={dateBounds.max}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                disabled={isMounted && mutation.isPending}
              />
            </Field>
          )}
        </form.Field>

        <form.Field name="shift">
          {(field) => (
            <Field>
              <FieldLabel>
                Shift <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={String(field.state.value || "day")}
                onValueChange={(val) => field.handleChange(val as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="production_area_id">
          {(field) => (
            <Field>
              <FieldLabel>
                Production Area <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={String(field.state.value || "")}
                onValueChange={(val) => field.handleChange(val)}
                disabled={isLoadingAreas}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  {areaOptions.map((a) => (
                    <SelectItem key={a.id} value={String(a.id)}>
                      {a.area_code} - {a.area_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="production_line_id">
          {(field) => (
            <Field>
              <FieldLabel>
                Production Line <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={String(field.state.value || "")}
                onValueChange={(val) => field.handleChange(val)}
                disabled={isLoadingLines}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Line" />
                </SelectTrigger>
                <SelectContent>
                  {lineOptions.map((l) => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.line_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>

        <form.Field name="operation_type">
          {(field) => (
            <Field className="sm:col-span-2">
              <FieldLabel>
                Operation Type <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={String(field.state.value || "regular")}
                onValueChange={(val) => field.handleChange(val as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="regular">Regular</SelectItem>
                  <SelectItem value="last_prod">Last Production</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          )}
        </form.Field>
      </div>

      {/* ITEMS MANAGER */}
      <div className="space-y-6 border-t pt-4">
        <div className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Production Items Layout</h3>
          {isCheckingExisting && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>

        <form.Field name="items">
          {(field) => {
            const allItems = field.state.value || []

            const handleAddItem = () => {
              setCartError(null)
              if (!selectedSku) return setCartError("Please select a SKU item")
              if (!qtyInput || Number(qtyInput) <= 0)
                return setCartError("Quantity additions must be greater than 0")

              const parsedQty = Number(qtyInput)

              // Find the full object so we can extract its real ID
              const matchSku = skuOptions.find(
                (i) => i.sku_code === selectedSku
              )

              if (!matchSku) return setCartError("Invalid SKU selected")

              const uomValue = matchSku?.sku_uoms?.uom_name ?? ""

              // Check if it exists in cart based on its ID, not its string code
              const targetIndex = allItems.findIndex(
                (i) => String(i.sku_id) === String(matchSku.id)
              )

              if (targetIndex > -1) {
                const updated = allItems.map((item, idx) =>
                  idx === targetIndex
                    ? {
                        ...item,
                        qty: item.qty + parsedQty,
                        uom: item.uom || uomValue,
                      }
                    : item
                )
                field.handleChange(updated)
              } else {
                field.handleChange([
                  ...allItems,
                  {
                    sku_id: matchSku.id! as string | number, // Fixed type guarantee for TS
                    sku_code: matchSku.sku_code,
                    qty: parsedQty,
                    uom: uomValue,
                  },
                ])
              }

              setSelectedSku("")
              setQtyInput(1)
            }

            const handleItemQtyChange = (
              skuId: string | number,
              value: number,
              minAllowed: number
            ) => {
              if (isNaN(value)) return
              const safeValue = Math.max(minAllowed, value)
              field.handleChange(
                allItems.map((i) =>
                  String(i.sku_id) === String(skuId)
                    ? { ...i, qty: safeValue }
                    : i
                )
              )
            }

            const handleRevertBaselineAdjustment = (
              skuId: string | number,
              baseQty: number
            ) => {
              field.handleChange(
                allItems.map((i) =>
                  String(i.sku_id) === String(skuId)
                    ? { ...i, qty: baseQty }
                    : i
                )
              )
            }

            const handleRemoveNewItem = (skuId: string | number) => {
              field.handleChange(
                allItems.filter((i) => String(i.sku_id) !== String(skuId))
              )
            }

            return (
              <div className="space-y-6">
                {/* SEARCH INPUT ROW */}
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end">
                  <div className="flex-1 space-y-1">
                    <FieldLabel className="text-xs">Find Item SKU</FieldLabel>
                    <Popover
                      open={openSkuPopover}
                      onOpenChange={setOpenSkuPopover}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between bg-background font-normal"
                        >
                          {selectedSku ? (
                            <span className="font-semibold">{selectedSku}</span>
                          ) : (
                            <span className="text-muted-foreground">
                              Search SKU...
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search..."
                            value={skuSearchQuery}
                            onValueChange={setSkuSearchQuery}
                          />
                          <CommandList>
                            {isLoadingSkus ? (
                              <div className="p-4 text-center text-xs text-muted-foreground">
                                Loading...
                              </div>
                            ) : (
                              <CommandGroup>
                                {skuOptions.map((item) => (
                                  <CommandItem
                                    key={item.sku_code}
                                    onSelect={() => {
                                      setSelectedSku(item.sku_code)
                                      setOpenSkuPopover(false)
                                    }}
                                  >
                                    {item.sku_code}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className="w-full space-y-1 sm:w-28">
                    <FieldLabel htmlFor="temp-qty" className="text-xs">
                      Add Qty (+)
                    </FieldLabel>
                    <Input
                      id="temp-qty"
                      type="number"
                      min={1}
                      value={qtyInput}
                      onChange={(e) =>
                        setQtyInput(
                          e.target.value === ""
                            ? ""
                            : Math.max(1, Number(e.target.value))
                        )
                      }
                      onKeyDown={(e) =>
                        e.key === "Enter" &&
                        (e.preventDefault(), handleAddItem())
                      }
                    />
                  </div>

                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddItem}
                    className="gap-1"
                  >
                    <Plus className="h-4 w-4" /> Add
                  </Button>
                </div>

                {cartError && (
                  <p className="text-xs font-medium text-red-500">
                    {cartError}
                  </p>
                )}

                {/* TABLE 1: EXISTING DB RECORDS VIEW */}
                {baselineItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                      Existing Database Quantities
                    </div>
                    <div className="overflow-hidden rounded-md border bg-muted/10">
                      <table className="w-full text-left text-sm">
                        <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                          <tr>
                            <th className="px-3 py-2">SKU Code</th>
                            <th className="w-32 px-3 py-2 text-center">
                              Base DB Qty
                            </th>
                            <th className="w-32 px-3 py-2 text-center">
                              Added (+)
                            </th>
                            <th className="w-32 px-3 py-2 text-center">
                              Final Target Qty
                            </th>
                            <th className="w-16 px-3 py-2 text-right">
                              Action
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y bg-background">
                          {baselineItems.map((exItem: any) => {
                            const exSkuId = exItem.sku_id || exItem.sku
                            const exSkuCode =
                              exItem.sku_code || exItem.sku?.sku_code || exSkuId
                            const exQty = Number(exItem.qty || exItem.quantity)
                            const currentFormMatch = allItems.find(
                              (i) => String(i.sku_id) === String(exSkuId)
                            )
                            const currentQty = currentFormMatch
                              ? currentFormMatch.qty
                              : exQty
                            const addedDelta = Math.max(0, currentQty - exQty)

                            return (
                              <tr
                                key={String(exSkuId)}
                                className="hover:bg-muted/5"
                              >
                                <td className="px-3 py-2 font-medium">
                                  {exSkuCode}
                                  {exItem.uom && (
                                    <span className="ml-2 rounded border px-1 text-[10px] text-muted-foreground">
                                      {exItem.uom}
                                    </span>
                                  )}
                                </td>
                                <td className="bg-muted/20 px-3 py-2 text-center font-semibold text-muted-foreground">
                                  {exQty}
                                </td>
                                <td className="px-3 py-2 text-center">
                                  {addedDelta > 0 ? (
                                    <span className="rounded border border-green-200 bg-green-50 px-2 py-0.5 text-xs font-bold text-green-600">
                                      +{addedDelta}
                                    </span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      —
                                    </span>
                                  )}
                                </td>
                                <td className="px-3 py-2 text-center text-sm font-bold">
                                  {currentQty}
                                </td>
                                <td className="px-3 py-2 text-right">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 w-8 p-0 text-orange-500 hover:bg-orange-50 disabled:opacity-0"
                                    onClick={() =>
                                      handleRevertBaselineAdjustment(
                                        exSkuId,
                                        exQty
                                      )
                                    }
                                    disabled={addedDelta === 0}
                                    title="Clear Added Quantities"
                                  >
                                    <Undo2 className="h-4 w-4" />
                                  </Button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* TABLE 2: ACTIVE CART (ALL ITEMS) */}
                <div className="space-y-2">
                  <div className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Active Cart
                  </div>
                  <div className="overflow-hidden rounded-md border">
                    <table className="w-full text-left text-sm">
                      <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                        <tr>
                          <th className="px-3 py-2">SKU Code</th>
                          <th className="w-40 px-3 py-2 text-center">
                            Total Quantity
                          </th>
                          <th className="w-32 px-3 py-2 text-center">UOM</th>
                          <th className="w-16 px-3 py-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {allItems.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="px-3 py-4 text-center text-xs text-muted-foreground italic"
                            >
                              Cart is empty.
                            </td>
                          </tr>
                        ) : (
                          allItems.map((item) => {
                            const baseMatch = baselineItems.find(
                              (b: any) =>
                                String(b.sku_id || b.sku) ===
                                String(item.sku_id)
                            )
                            const baseQty = baseMatch
                              ? Number(baseMatch.qty || baseMatch.quantity)
                              : 0
                            const isExisting = baseQty > 0
                            const minAllowed = isExisting ? baseQty : 1

                            return (
                              <tr
                                key={String(item.sku_id)}
                                className="hover:bg-muted/20"
                              >
                                <td
                                  className={cn(
                                    "px-3 py-2 font-medium",
                                    isExisting
                                      ? "text-foreground"
                                      : "text-blue-600"
                                  )}
                                >
                                  {item.sku_code || item.sku_id}
                                </td>
                                <td className="px-3 py-2">
                                  <div className="flex justify-center">
                                    <Input
                                      type="number"
                                      min={minAllowed}
                                      className={cn(
                                        "h-8 w-24 text-center font-semibold",
                                        !isExisting &&
                                          "border-blue-200 bg-blue-50/20 text-blue-900"
                                      )}
                                      value={item.qty}
                                      onChange={(e) =>
                                        handleItemQtyChange(
                                          item.sku_id,
                                          parseInt(e.target.value, 10),
                                          minAllowed
                                        )
                                      }
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-2 text-center">
                                  <Badge variant="outline">
                                    {item.uom || "N/A"}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 text-right">
                                  {isExisting ? (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-orange-500 hover:bg-orange-50 disabled:opacity-0"
                                      onClick={() =>
                                        handleRevertBaselineAdjustment(
                                          item.sku_id,
                                          baseQty
                                        )
                                      }
                                      disabled={item.qty === baseQty}
                                      title="Clear Added Quantities"
                                    >
                                      <Undo2 className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0 text-red-500 hover:bg-red-50"
                                      onClick={() =>
                                        handleRemoveNewItem(item.sku_id)
                                      }
                                      title="Remove Item"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )
          }}
        </form.Field>
      </div>

      {/* FOOTER ACTIONS */}
      <div className="flex items-center justify-end gap-3 border-t pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            form.reset()
            if (onClose) onClose()
          }}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditMode ? "Save Changes" : "Submit Production"}
        </Button>
      </div>
    </form>
  )
}
