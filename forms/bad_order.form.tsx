"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
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
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  createBadOrder,
  getBadOrder,
  updateBadOrder,
  searchOutlets,
  searchSkus,
} from "./queries/bad_order.query"
import { badOrderSchema } from "./schemas/bad_order.schema"

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

export function BadOrderForm({
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
  const [entryExp, setEntryExp] = useState("")
  const [entryReason, setEntryReason] = useState("")

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

  const { data: badOrderData, isLoading: isLoadingData } = useQuery({
    queryKey: ["bad_orders", id],
    queryFn: () => getBadOrder(id!),
    enabled: isEditMode,
  })

  useEffect(() => {
    if (isEditMode && badOrderData?.bad_orders_items) {
      const labels: Record<number, string> = {}
      badOrderData.bad_orders_items.forEach((item: any) => {
        const sku = getFirstItem(item.skus)
        if (sku) labels[item.sku_id] = `${sku.sku_code} - ${sku.item_name}`
      })
      setSkuLabels((prev) => ({ ...prev, ...labels }))
    }
  }, [isEditMode, badOrderData])

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof badOrderSchema>) => {
      if (isEditMode) {
        return updateBadOrder(id!, values)
      }
      return createBadOrder(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })

  const dv: z.input<typeof badOrderSchema> = {
    outlet_id: badOrderData?.outlet_id ?? 0,
    type: badOrderData?.type ?? "return_to_wh",
    notes: badOrderData?.notes ?? "",
    items: badOrderData?.bad_orders_items
      ? badOrderData.bad_orders_items.map((i: any) => ({
          sku_id: i.sku_id,
          qty: i.qty,
          expiration_date: i.expiration_date ?? "",
          reason: i.reason,
        }))
      : [],
  }

  const form = useForm({
    defaultValues: dv,
    validators: { onSubmit: badOrderSchema },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoadingData) {
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
      {/* HEADER */}
      <div className="grid gap-4 md:grid-cols-2">
        <form.Field name="outlet_id">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            const selectedOption = outletOptions.find(
              (opt) => opt.value === field.state.value
            )
            const outlet = getFirstItem(badOrderData?.outlets)
            const displayLabel = selectedOption
              ? selectedOption.label
              : outlet
                ? `${outlet.outlet_code} - ${outlet.outlet_name}`
                : field.state.value
                  ? "Selected Outlet"
                  : "Select Outlet..."

            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel>
                  Target Outlet <span className="text-red-500">*</span>
                </FieldLabel>
                <Popover open={outletOpen} onOpenChange={setOutletOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                      disabled={mutation.isPending}
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
                          <div className="p-2 text-center text-xs text-muted-foreground">
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

        <form.Field name="type">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>
                Order Type <span className="text-red-500">*</span>
              </FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(val) =>
                  field.handleChange(val as "for_disposal" | "return_to_wh")
                }
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="return_to_wh">
                    Return to Warehouse
                  </SelectItem>
                  <SelectItem value="for_disposal">For Disposal</SelectItem>
                </SelectContent>
              </Select>
              {field.state.meta.isTouched && !field.state.meta.isValid && (
                <FieldError errors={field.state.meta.errors} />
              )}
            </Field>
          )}
        </form.Field>
      </div>

      <form.Field name="notes">
        {(field) => (
          <Field
            data-invalid={
              field.state.meta.isTouched && !field.state.meta.isValid
            }
          >
            <FieldLabel>Notes</FieldLabel>
            <Textarea
              value={field.state.value || ""}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Additional context about this bad order..."
              disabled={mutation.isPending}
              rows={2}
            />
          </Field>
        )}
      </form.Field>

      <hr />

      {/* ITEMS CART */}
      <div className="space-y-4">
        <h4 className="text-sm font-semibold">SKU Items</h4>

        <form.Field name="items" mode="array">
          {(field) => {
            const handleAddToCart = () => {
              if (
                !entrySku ||
                entryQty === "" ||
                Number(entryQty) <= 0 ||
                !entryReason.trim()
              ) {
                toast.error("Please fill in SKU, Quantity, and Reason.")
                return
              }

              field.pushValue({
                sku_id: entrySku,
                qty: Number(entryQty),
                expiration_date: entryExp || null,
                reason: entryReason.trim(),
              })

              setEntrySku(0)
              setEntryQty("")
              setEntryExp("")
              setEntryReason("")
            }

            return (
              <div className="space-y-4">
                {/* 1. ENTRY CONSOLE */}
                <div className="grid grid-cols-[2fr_1fr_1.5fr_2fr_auto] items-end gap-3 rounded-md border bg-muted/20 p-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      SKU <span className="text-red-500">*</span>
                    </label>
                    <SkuCombobox
                      value={entrySku}
                      onChange={(val, label) => {
                        setEntrySku(val)
                        if (val && label)
                          setSkuLabels((prev) => ({ ...prev, [val]: label }))
                      }}
                      disabled={mutation.isPending}
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
                      disabled={mutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Exp Date
                    </label>
                    <Input
                      type="date"
                      value={entryExp}
                      onChange={(e) => setEntryExp(e.target.value)}
                      disabled={mutation.isPending}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-muted-foreground">
                      Reason <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={entryReason}
                      onChange={(e) => setEntryReason(e.target.value)}
                      placeholder="e.g. Damaged"
                      disabled={mutation.isPending}
                    />
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddToCart}
                    disabled={mutation.isPending}
                  >
                    <Plus className="mr-1 h-4 w-4" /> Add
                  </Button>
                </div>

                {field.state.meta.isTouched && !field.state.meta.isValid && (
                  <p className="text-sm font-medium text-destructive">
                    {field.state.meta.errors.join(", ")}
                  </p>
                )}

                {/* 2. CART TABLE */}
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>SKU</TableHead>
                        <TableHead className="w-[100px]">Qty</TableHead>
                        <TableHead className="w-[130px]">Exp Date</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead className="w-[60px] text-right">
                          Action
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {field.state.value.length === 0 && (
                        <TableRow>
                          <TableCell
                            colSpan={5}
                            className="h-24 text-center text-muted-foreground"
                          >
                            Cart is empty. Add SKUs above.
                          </TableCell>
                        </TableRow>
                      )}

                      {field.state.value.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell
                            className="max-w-[200px] truncate font-medium"
                            title={skuLabels[item.sku_id]}
                          >
                            {skuLabels[item.sku_id] || `SKU ID: ${item.sku_id}`}
                          </TableCell>
                          <TableCell>{item.qty}</TableCell>
                          <TableCell>{item.expiration_date || "—"}</TableCell>
                          <TableCell
                            className="max-w-[150px] truncate"
                            title={item.reason}
                          >
                            {item.reason}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:bg-destructive/10"
                              onClick={() => field.removeValue(i)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
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
            ? "Update Bad Order"
            : "Submit Bad Order"}
      </Button>
    </form>
  )
}
