"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  Check,
  ChevronsUpDown,
  Loader2,
  Plus,
  ShoppingCart,
  Trash2,
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

  // Prevent hydration mismatch
  const [isMounted, setIsMounted] = React.useState(false)

  // Local state for Item Cart Input
  const [selectedSku, setSelectedSku] = React.useState<string>("")
  const [qtyInput, setQtyInput] = React.useState<number | "">(1)
  const [cartError, setCartError] = React.useState<string | null>(null)
  const [openSkuPopover, setOpenSkuPopover] = React.useState(false)
  const [skuSearchQuery, setSkuSearchQuery] = React.useState("")

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  let id = params?.id as string | undefined
  if (editId) {
    id = editId
  }

  const isEditMode = !!id

  // 1. Fetch Production Area options
  const { data: areaOptions = [], isLoading: isLoadingAreas } = useQuery({
    queryKey: ["production_areas_options"],
    queryFn: () => searchProductionAreas(""),
  })

  // 2. Fetch Production Line options
  const { data: lineOptions = [], isLoading: isLoadingLines } = useQuery({
    queryKey: ["production_lines_options"],
    queryFn: () => searchProductionLines(""),
  })

  // 3. Search SKUs for Combobox
  const { data: skuOptions = [], isLoading: isLoadingSkus } = useQuery({
    queryKey: ["sku_options", skuSearchQuery],
    queryFn: () => searchSkus(skuSearchQuery),
  })

  // 4. Fetch existing production data if in Edit Mode
  const { data: productionData, isLoading: isLoadingProduction } = useQuery({
    queryKey: ["productions", id],
    queryFn: () => getProduction(id!),
    enabled: isEditMode,
  })

  // 5. Handle Create / Update Mutation
  const mutation = useMutation({
    mutationFn: (values: ProductionFormValues) => {
      if (isEditMode) {
        return updateProduction({ ...values, id })
      }
      return createProduction(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productions"] })
      form.reset()
      if (onClose) {
        onClose()
      }
    },
  })

  // 6. Initialize Form
  const form = useForm({
    defaultValues: {
      production_date: productionData?.production_date ?? "",
      production_area: productionData?.production_area
        ? String(productionData.production_area)
        : "",
      production_line: productionData?.production_line
        ? String(productionData.production_line)
        : "",
      shift: (productionData?.shift as "day" | "night") ?? "day",
      operation_type:
        (productionData?.operation_type as
          "startup" | "last_prod" | "regular") ?? "regular",
      items:
        (productionData?.items as {
          sku: string
          quantity: number
          uom?: string
        }[]) ?? [],
    },
    validators: {
      onSubmit: productionSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value as ProductionFormValues)
    },
  })

  // Sync loaded async data into form fields during edit mode
  React.useEffect(() => {
    if (productionData) {
      form.reset({
        production_date: productionData.production_date ?? "",
        production_area: productionData.production_area
          ? String(productionData.production_area)
          : "",
        production_line: productionData.production_line
          ? String(productionData.production_line)
          : "",
        shift: (productionData.shift as "day" | "night") ?? "day",
        operation_type:
          (productionData.operation_type as
            "startup" | "last_prod" | "regular") ?? "regular",
        items: productionData.items ?? [],
      })
    }
  }, [productionData, form])

  const isAreaSelectDisabled = isMounted
    ? mutation.isPending || isLoadingAreas
    : false

  const isLineSelectDisabled = isMounted
    ? mutation.isPending || isLoadingLines
    : false

  if (isEditMode && isLoadingProduction) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading production details...
      </div>
    )
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Production Date */}
        <form.Field name="production_date">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Production Date <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="date"
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  disabled={isMounted && mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* Shift */}
        <form.Field name="shift">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const currentValue = field.state.value
              ? String(field.state.value)
              : "day"

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Shift <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  key={currentValue}
                  value={currentValue}
                  onValueChange={(val) =>
                    field.handleChange(val as "day" | "night")
                  }
                  disabled={isMounted && mutation.isPending}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select shift" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="day">Day</SelectItem>
                    <SelectItem value="night">Night</SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* Production Area */}
        <form.Field name="production_area">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const currentValue = field.state.value
              ? String(field.state.value)
              : ""

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Production Area <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  key={currentValue || "area-select"}
                  value={currentValue}
                  onValueChange={(val) => field.handleChange(val)}
                  disabled={isAreaSelectDisabled}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue
                      placeholder={
                        isLoadingAreas && isMounted
                          ? "Loading areas..."
                          : "Select production area"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {areaOptions.map((area) => (
                      <SelectItem key={String(area.id)} value={String(area.id)}>
                        {area.area_code} - {area.area_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* Production Line */}
        <form.Field name="production_line">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const currentValue = field.state.value
              ? String(field.state.value)
              : ""

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Production Line <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  key={currentValue || "line-select"}
                  value={currentValue}
                  onValueChange={(val) => field.handleChange(val)}
                  disabled={isLineSelectDisabled}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue
                      placeholder={
                        isLoadingLines && isMounted
                          ? "Loading lines..."
                          : "Select production line"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {lineOptions.map((line) => (
                      <SelectItem key={String(line.id)} value={String(line.id)}>
                        {line.line_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* Operation Type */}
        <form.Field name="operation_type">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const currentValue = field.state.value
              ? String(field.state.value)
              : "regular"

            return (
              <Field data-invalid={isInvalid} className="sm:col-span-2">
                <FieldLabel htmlFor={field.name}>
                  Operation Type <span className="text-red-500">*</span>
                </FieldLabel>
                <Select
                  key={currentValue}
                  value={currentValue}
                  onValueChange={(val) =>
                    field.handleChange(
                      val as "startup" | "last_prod" | "regular"
                    )
                  }
                  disabled={isMounted && mutation.isPending}
                >
                  <SelectTrigger id={field.name}>
                    <SelectValue placeholder="Select operation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">Startup</SelectItem>
                    <SelectItem value="regular">Regular</SelectItem>
                    <SelectItem value="last_prod">Last Production</SelectItem>
                  </SelectContent>
                </Select>
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </div>

      {/* 🛒 SEARCHABLE ITEM CART SECTION */}
      <div className="border-t pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Production Items</h3>
          </div>
        </div>

        <form.Field name="items">
          {(field) => {
            const items = field.state.value || []
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid

            // Handler to add selected SKU to the list
            const handleAddItem = () => {
              setCartError(null)

              if (!selectedSku) {
                setCartError("Please select a SKU item")
                return
              }
              if (!qtyInput || Number(qtyInput) <= 0) {
                setCartError("Quantity must be greater than 0")
                return
              }

              const parsedQty = Number(qtyInput)
              const selectedSkuObj = skuOptions.find(
                (item) => item.sku_code === selectedSku
              )
              const uomValue = selectedSkuObj?.uom ?? ""

              // Immutable update for existing SKU or appending new SKU
              const existingIndex = items.findIndex(
                (i) => i.sku === selectedSku
              )
              if (existingIndex > -1) {
                const updatedItems = items.map((item, idx) =>
                  idx === existingIndex
                    ? {
                        ...item,
                        quantity: item.quantity + parsedQty,
                        uom: item.uom || uomValue,
                      }
                    : item
                )
                field.handleChange(updatedItems)
              } else {
                field.handleChange([
                  ...items,
                  { sku: selectedSku, quantity: parsedQty, uom: uomValue },
                ])
              }

              // Reset local inputs
              setSelectedSku("")
              setQtyInput(1)
            }

            const handleRemoveItem = (index: number) => {
              const updated = items.filter((_, i) => i !== index)
              field.handleChange(updated)
            }

            const handleQuantityChange = (index: number, newQty: number) => {
              if (isNaN(newQty) || newQty < 1) return
              const updated = items.map((item, i) =>
                i === index ? { ...item, quantity: newQty } : item
              )
              field.handleChange(updated)
            }

            // Find current selected SKU label for button preview
            const currentSelectedItem = skuOptions.find(
              (item) => item.sku_code === selectedSku
            )

            return (
              <div className="space-y-4">
                {/* Searchable Combobox + Quantity Row */}
                <div className="flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 sm:flex-row sm:items-end">
                  {/* SKU Combobox */}
                  <div className="flex-1 space-y-1">
                    <FieldLabel className="text-xs">Select SKU Item</FieldLabel>
                    <Popover
                      open={openSkuPopover}
                      onOpenChange={setOpenSkuPopover}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openSkuPopover}
                          className="w-full justify-between bg-background font-normal"
                          disabled={isMounted && mutation.isPending}
                        >
                          {currentSelectedItem ? (
                            <span className="truncate">
                              <span className="font-semibold">
                                {currentSelectedItem.sku_code}
                              </span>{" "}
                              - {currentSelectedItem.item_name}
                            </span>
                          ) : selectedSku ? (
                            <span className="font-semibold">{selectedSku}</span>
                          ) : (
                            <span className="text-muted-foreground">
                              Search SKU code or name...
                            </span>
                          )}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[350px] p-0" align="start">
                        <Command shouldFilter={false}>
                          <CommandInput
                            placeholder="Search SKU..."
                            value={skuSearchQuery}
                            onValueChange={setSkuSearchQuery}
                          />
                          <CommandList>
                            {isLoadingSkus ? (
                              <div className="flex items-center justify-center p-4 text-xs text-muted-foreground">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Searching SKUs...
                              </div>
                            ) : skuOptions.length === 0 ? (
                              <CommandEmpty>No SKU items found.</CommandEmpty>
                            ) : (
                              <CommandGroup>
                                {skuOptions.map((item) => {
                                  const isSelected =
                                    selectedSku === item.sku_code
                                  return (
                                    <CommandItem
                                      key={item.sku_code}
                                      value={item.sku_code}
                                      onSelect={() => {
                                        setSelectedSku(item.sku_code)
                                        setOpenSkuPopover(false)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          isSelected
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                      />
                                      <div className="flex flex-col">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium">
                                            {item.sku_code}
                                          </span>
                                          {item.uom && (
                                            <span className="text-[10px] text-muted-foreground">
                                              ({item.uom})
                                            </span>
                                          )}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          {item.item_name}
                                        </span>
                                      </div>
                                    </CommandItem>
                                  )
                                })}
                              </CommandGroup>
                            )}
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Quantity Input */}
                  <div className="w-full space-y-1 sm:w-28">
                    <FieldLabel htmlFor="temp-qty" className="text-xs">
                      Quantity
                    </FieldLabel>
                    <Input
                      id="temp-qty"
                      type="number"
                      min={1}
                      placeholder="Qty"
                      value={qtyInput}
                      onChange={(e) =>
                        setQtyInput(
                          e.target.value === "" ? "" : Number(e.target.value)
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          handleAddItem()
                        }
                      }}
                      disabled={isMounted && mutation.isPending}
                    />
                  </div>

                  {/* Add Button */}
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleAddItem}
                    disabled={isMounted && mutation.isPending}
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

                {/* Selected Items Table */}
                <div className="overflow-hidden rounded-md border">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b bg-muted/50 text-xs font-medium text-muted-foreground uppercase">
                      <tr>
                        <th className="px-3 py-2">SKU Code</th>
                        <th className="w-32 px-3 py-2">Quantity</th>
                        <th className="w-32 px-3 py-2">UOM</th>
                        <th className="w-16 px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {items.length === 0 ? (
                        <tr>
                          <td
                            colSpan={4}
                            className="px-3 py-4 text-center text-xs text-muted-foreground"
                          >
                            No items added to this production order yet.
                          </td>
                        </tr>
                      ) : (
                        items.map((item, idx) => (
                          <tr
                            key={`${item.sku}-${idx}`}
                            className="hover:bg-muted/20"
                          >
                            <td className="px-3 py-2 font-medium">
                              {item.sku}
                            </td>
                            <td className="px-3 py-2">
                              <Input
                                type="number"
                                min={1}
                                className="h-8 w-24"
                                value={item.quantity}
                                onChange={(e) =>
                                  handleQuantityChange(
                                    idx,
                                    parseInt(e.target.value, 10)
                                  )
                                }
                                disabled={isMounted && mutation.isPending}
                              />
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="outline">
                                {item.uom || "N/A"}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() => handleRemoveItem(idx)}
                                disabled={isMounted && mutation.isPending}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </div>
            )
          }}
        </form.Field>
      </div>

      {/* FORM ACTIONS */}
      <div className="flex items-center justify-end gap-2 border-t pt-4">
        {onClose && (
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isMounted && mutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isMounted && mutation.isPending}>
          {mutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : isEditMode ? (
            "Update Production"
          ) : (
            "Create Production"
          )}
        </Button>
      </div>
    </form>
  )
}
