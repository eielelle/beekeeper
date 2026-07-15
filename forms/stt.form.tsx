"use client"

import * as React from "react"
import { useForm, useStore } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Loader2, Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import {
  createStts,
  getStt,
  updateStt,
  searchOutlets,
  fetchSttByOutlet,
} from "./queries/stt.query"
import { searchSkus } from "./queries/sku.query"
import { sttCartSchema } from "./schemas/stt.schema"

const getFirstItem = (data: any) => (Array.isArray(data) ? data[0] : data)

function SkuCombobox({
  value,
  onChange,
  disabled,
  initialLabel,
}: {
  value: number
  onChange: (val: number, label: string) => void
  disabled?: boolean
  initialLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timer)
  }, [search])

  const { data: skuResults = [], isLoading } = useQuery({
    queryKey: ["sku-options", debouncedSearch],
    queryFn: () => searchSkus(debouncedSearch, 20),
  })

  const options = skuResults.map((sku) => ({
    value: Number(sku.id),
    label: `${sku.sku_code} - ${sku.item_name}`,
  }))

  const selectedOption = options.find((opt) => opt.value === value)
  const displayLabel = selectedOption
    ? selectedOption.label
    : value
      ? initialLabel || "Selected SKU"
      : "Select SKU..."

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled}
        >
          <span className="truncate pr-2">{displayLabel}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
      >
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search SKU..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList className="max-h-[200px] overflow-y-auto">
            {isLoading && (
              <div className="flex items-center justify-center space-x-2 p-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Searching SKUs...</span>
              </div>
            )}
            {!isLoading && options.length === 0 && (
              <CommandEmpty>No SKU found.</CommandEmpty>
            )}
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.label}
                  onSelect={() => {
                    const isDeselecting = option.value === value
                    onChange(
                      isDeselecting ? 0 : option.value,
                      isDeselecting ? "" : option.label
                    )
                    setOpen(false)
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4 shrink-0",
                      value === option.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export function SttForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()
  let id = params?.id as string | undefined
  if (editId) id = editId
  const isEditMode = !!id

  const [skuLabels, setSkuLabels] = useState<Record<number, string>>({})
  const [entrySku, setEntrySku] = useState(0)
  const [entryQty, setEntryQty] = useState<number | "">("")

  const [outletOpen, setOutletOpen] = useState(false)
  const [outletSearch, setOutletSearch] = useState("")
  const [debouncedOutletSearch, setDebouncedOutletSearch] = useState("")

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedOutletSearch(outletSearch), 300)
    return () => clearTimeout(timer)
  }, [outletSearch])

  const { data: outletResults = [], isLoading: isSearchingOutlets } = useQuery({
    queryKey: ["outlet-options", debouncedOutletSearch],
    queryFn: () => searchOutlets(debouncedOutletSearch, 20),
  })

  const outletOptions = outletResults.map((out) => ({
    value: Number(out.id),
    label: `${out.outlet_code} - ${out.outlet_name}`,
  }))

  const { data: sttData, isLoading: isLoadingStt } = useQuery({
    queryKey: ["stts", id],
    queryFn: () => getStt(id!),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (isEditMode && sttData?.skus) {
      const sku = getFirstItem(sttData.skus)
      setSkuLabels((prev) => ({
        ...prev,
        [sttData.sku_id as number]: `${sku?.sku_code} - ${sku?.item_name}`,
      }))
    }
  }, [isEditMode, sttData])

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof sttCartSchema>) => {
      if (isEditMode) {
        return updateStt(id!, values)
      }
      return createStts(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })

  const dv: z.input<typeof sttCartSchema> = {
    outlet_id: sttData?.outlet_id ?? 0,
    items:
      isEditMode && sttData
        ? [
            {
              sku_id: sttData.sku_id as number,
              qty: sttData.qty,
            },
          ]
        : [],
  }

  const form = useForm({
    defaultValues: dv,
    validators: { onSubmit: sttCartSchema },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  const selectedOutletId = useStore(
    form.store,
    (state) => state.values.outlet_id
  ) as number

  const { data: stockData = [], isLoading: isLoadingStock } = useQuery({
    queryKey: ["outlet-stt", selectedOutletId],
    queryFn: () => fetchSttByOutlet(selectedOutletId),
    enabled: !isEditMode && !!selectedOutletId && selectedOutletId > 0,
  })

  if (isEditMode && isLoadingStt) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading details...</span>
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
      {/* TOP LEVEL: OUTLET COMBOBOX */}
      <form.Field name="outlet_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const selectedOption = outletOptions.find(
            (opt) => opt.value === field.state.value
          )

          const outlet = getFirstItem(sttData?.outlets)

          const displayLabel = selectedOption
            ? selectedOption.label
            : outlet
              ? `${outlet.outlet_code} - ${outlet.outlet_name}`
              : field.state.value
                ? "Selected Outlet"
                : "Select Outlet..."

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Target Outlet <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Popover open={outletOpen} onOpenChange={setOutletOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={outletOpen}
                    className="w-full justify-between"
                    disabled={mutation.isPending || isEditMode}
                  >
                    <span className="truncate pr-2">{displayLabel}</span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Command shouldFilter={false}>
                    <CommandInput
                      placeholder="Search Outlet..."
                      value={outletSearch}
                      onValueChange={setOutletSearch}
                    />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                      {isSearchingOutlets && (
                        <div className="flex items-center justify-center p-2 text-xs text-muted-foreground">
                          <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                          Searching...
                        </div>
                      )}
                      {!isSearchingOutlets && outletOptions.length === 0 && (
                        <CommandEmpty>No Outlet found.</CommandEmpty>
                      )}
                      <CommandGroup>
                        {outletOptions.map((option) => (
                          <CommandItem
                            key={option.value}
                            value={option.label}
                            onSelect={() => {
                              field.handleChange(
                                option.value === field.state.value
                                  ? 0
                                  : option.value
                              )
                              setOutletOpen(false)
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4 shrink-0",
                                field.state.value === option.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate">{option.label}</span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <hr />

      {/* CART SYSTEM */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">STT Cart</h4>

        <form.Field name="items" mode="array">
          {(field) => {
            const handleAddToCart = () => {
              if (!entrySku || entryQty === "" || Number(entryQty) <= 0) {
                toast.error("Please select a SKU and enter a valid quantity.")
                return
              }

              field.pushValue({
                sku_id: entrySku,
                qty: Number(entryQty),
              })

              setEntrySku(0)
              setEntryQty("")
            }

            return (
              <div className="space-y-4">
                {/* 1. ENTRY CONSOLE (No expiration date) */}
                {!isEditMode && (
                  <div className="grid grid-cols-[4fr_2fr_auto] items-end gap-3 rounded-md border bg-muted/20 p-3">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        SKU <span className="text-red-500">*</span>
                      </label>
                      <SkuCombobox
                        value={entrySku}
                        onChange={(val, label) => {
                          setEntrySku(val)
                          if (val && label) {
                            setSkuLabels((prev) => ({ ...prev, [val]: label }))
                          }
                        }}
                        disabled={mutation.isPending || !selectedOutletId}
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-muted-foreground">
                        Qty <span className="text-red-500">*</span>
                      </label>
                      <Input
                        type="number"
                        min={1}
                        value={entryQty}
                        onChange={(e) =>
                          setEntryQty(
                            e.target.value === "" ? "" : Number(e.target.value)
                          )
                        }
                        disabled={mutation.isPending || !selectedOutletId}
                      />
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddToCart}
                      disabled={mutation.isPending || !selectedOutletId}
                    >
                      <Plus className="mr-1 h-4 w-4" /> Add
                    </Button>
                  </div>
                )}

                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <p className="text-sm font-medium text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}

                {/* 2. THE TABLE */}
                <div className="max-h-[350px] overflow-y-auto rounded-md border">
                  <Table>
                    <TableHeader className="sticky top-0 z-10 bg-muted/50 backdrop-blur-sm">
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead className="w-[150px]">Quantity</TableHead>
                        {!isEditMode && (
                          <TableHead className="w-[80px] text-right">
                            Action
                          </TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoadingStock && (
                        <TableRow>
                          <TableCell
                            colSpan={3}
                            className="h-24 text-center text-muted-foreground"
                          >
                            <Loader2 className="mr-2 inline-block h-4 w-4 animate-spin" />
                            Loading existing STT items...
                          </TableCell>
                        </TableRow>
                      )}

                      {!isEditMode &&
                        field.state.value.length === 0 &&
                        stockData.length === 0 &&
                        !isLoadingStock && (
                          <TableRow>
                            <TableCell
                              colSpan={3}
                              className="h-24 text-center text-muted-foreground"
                            >
                              {selectedOutletId
                                ? 'Cart is empty. Select a SKU and click "Add" to start.'
                                : "Select an Outlet to view and add STT."}
                            </TableCell>
                          </TableRow>
                        )}

                      {/* EXISTING STOCK (Read-Only) */}
                      {!isEditMode &&
                        stockData.map((item) => {
                          const sku = getFirstItem(item.skus)
                          return (
                            <TableRow
                              key={`existing-${item.id}`}
                              className="bg-muted/10 opacity-70 hover:bg-muted/20"
                            >
                              <TableCell
                                className="max-w-[250px] truncate font-medium text-muted-foreground"
                                title={`${sku?.sku_code} - ${sku?.item_name}`}
                              >
                                {sku?.sku_code} - {sku?.item_name}
                              </TableCell>
                              <TableCell className="text-muted-foreground">
                                {item.qty}
                              </TableCell>
                              <TableCell className="text-right">
                                <span className="rounded-sm border bg-background px-2 py-1 text-xs font-medium text-muted-foreground/60 italic">
                                  Existing
                                </span>
                              </TableCell>
                            </TableRow>
                          )
                        })}

                      {/* NEW ITEMS IN CART */}
                      {field.state.value.map((item, i) => (
                        <TableRow key={`new-${i}`}>
                          {isEditMode ? (
                            <>
                              <TableCell className="align-top">
                                <form.Field
                                  name={
                                    `items[${i}].sku_id` as `items[${number}].sku_id`
                                  }
                                >
                                  {(subField) => (
                                    <Field
                                      data-invalid={
                                        subField.state.meta.isTouched &&
                                        !subField.state.meta.isValid
                                      }
                                    >
                                      <SkuCombobox
                                        value={subField.state.value}
                                        onChange={(val, label) => {
                                          subField.handleChange(val)
                                          if (val && label)
                                            setSkuLabels((prev) => ({
                                              ...prev,
                                              [val]: label,
                                            }))
                                        }}
                                        disabled={mutation.isPending}
                                        initialLabel={
                                          skuLabels[subField.state.value]
                                        }
                                      />
                                      {subField.state.meta.isTouched &&
                                        !subField.state.meta.isValid && (
                                          <FieldError
                                            errors={subField.state.meta.errors}
                                          />
                                        )}
                                    </Field>
                                  )}
                                </form.Field>
                              </TableCell>
                              <TableCell className="align-top">
                                <form.Field
                                  name={
                                    `items[${i}].qty` as `items[${number}].qty`
                                  }
                                >
                                  {(subField) => (
                                    <Field
                                      data-invalid={
                                        subField.state.meta.isTouched &&
                                        !subField.state.meta.isValid
                                      }
                                    >
                                      <Input
                                        type="number"
                                        value={subField.state.value}
                                        onChange={(e) =>
                                          subField.handleChange(
                                            Number(e.target.value)
                                          )
                                        }
                                        disabled={mutation.isPending}
                                      />
                                      {subField.state.meta.isTouched &&
                                        !subField.state.meta.isValid && (
                                          <FieldError
                                            errors={subField.state.meta.errors}
                                          />
                                        )}
                                    </Field>
                                  )}
                                </form.Field>
                              </TableCell>
                            </>
                          ) : (
                            <>
                              <TableCell
                                className="max-w-[250px] truncate font-semibold text-primary"
                                title={skuLabels[item.sku_id]}
                              >
                                {skuLabels[item.sku_id] ||
                                  `SKU ID: ${item.sku_id}`}
                              </TableCell>
                              <TableCell className="font-semibold text-primary">
                                +{item.qty}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => field.removeValue(i)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )
          }}
        </form.Field>
      </div>

      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update STT"
            : "Checkout STT"}
      </Button>
    </form>
  )
}
