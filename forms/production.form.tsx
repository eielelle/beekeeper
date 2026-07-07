"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import {
  Trash2,
  Plus,
  ShoppingCart,
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react"

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { submitProductionBatch } from "./queries/production.query"
import { fetchProductionAreas } from "./queries/production_area.query"
import { fetchProductionLines } from "./queries/production_line.query"
import { fetchSkus } from "./queries/sku.query"
import { productionFormSchema } from "./schemas/production.schema"

export function ProductionForm() {
  const [areaSearch, setAreaSearch] = React.useState("")
  const debouncedAreaSearch = React.useDeferredValue(areaSearch)
  const [areaOpen, setAreaOpen] = React.useState(false)

  const [lineSearch, setLineSearch] = React.useState("")
  const debouncedLineSearch = React.useDeferredValue(lineSearch)
  const [lineOpen, setLineOpen] = React.useState(false)

  const [skuSearchTerms, setSkuSearchTerms] = React.useState<
    Record<number, string>
  >({})
  const [skuOpenStates, setSkuOpenStates] = React.useState<
    Record<number, boolean>
  >({})

  const activeRowIndex = Object.keys(skuOpenStates).find(
    (key) => skuOpenStates[Number(key)] === true
  )
  const currentSkuSearchPhrase =
    activeRowIndex !== undefined
      ? skuSearchTerms[Number(activeRowIndex)] || ""
      : ""
  const debouncedSkuSearch = React.useDeferredValue(currentSkuSearchPhrase)

  const { data: areasBatch, isLoading: isAreasLoading } = useQuery({
    queryKey: ["production_areas_combobox", debouncedAreaSearch],
    queryFn: () =>
      fetchProductionAreas({
        pageIndex: 0,
        pageSize: 10,
        globalFilter: debouncedAreaSearch,
      }),
  })

  const { data: linesBatch, isLoading: isLinesLoading } = useQuery({
    queryKey: ["production_lines_combobox", debouncedLineSearch],
    queryFn: () =>
      fetchProductionLines({
        pageIndex: 0,
        pageSize: 10,
        globalFilter: debouncedLineSearch,
      }),
  })

  const { data: skusBatch, isLoading: isSkusLoading } = useQuery({
    queryKey: ["skus_combobox", debouncedSkuSearch],
    queryFn: () =>
      fetchSkus({
        pageIndex: 0,
        pageSize: 15,
        globalFilter: debouncedSkuSearch,
      }),
  })

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof productionFormSchema>) => {
      return submitProductionBatch(values)
    },
    onSuccess: () => {
      form.reset()
      setSkuSearchTerms({})
      setSkuOpenStates({})
    },
  })

  const form = useForm({
    defaultValues: {
      production_date: "",
      production_area_id: "",
      production_line_id: "",
      is_day: true,
      operation_type: "",
      items: [{ sku_id: "", qty: "" }],
    },
    validators: {
      onSubmit: productionFormSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {/* SECTION 1: Master Production Run Metrics */}
      <div className="space-y-4 rounded-xl border bg-card p-4 shadow-sm">
        <h3 className="text-base font-semibold">Batch Details</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <form.Field name="production_date">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Date</FieldLabel>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                    aria-invalid={isInvalid}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="is_day">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Shift Schedule</FieldLabel>
                  <Select
                    value={String(field.state.value)}
                    onValueChange={(val) => field.handleChange(val === "true")}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger aria-invalid={isInvalid}>
                      <SelectValue placeholder="Select shift schedule" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Day Shift</SelectItem>
                      <SelectItem value="false">Night Shift</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="operation_type">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>Operation Phase</FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={field.handleChange}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger aria-invalid={isInvalid}>
                      <SelectValue placeholder="Select phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assembly">Assembly</SelectItem>
                      <SelectItem value="packaging">Packaging</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="production_area_id">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              const selectedOption = areasBatch?.data?.find(
                (a) => String(a.id) === String(field.state.value)
              )

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Production Area</FieldLabel>
                  <Popover open={areaOpen} onOpenChange={setAreaOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={areaOpen}
                        className="w-full justify-between text-left font-normal"
                        disabled={mutation.isPending}
                        aria-invalid={isInvalid}
                      >
                        {selectedOption
                          ? selectedOption.area_name
                          : "Select area..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search production area..."
                          value={areaSearch}
                          onChange={(e) => setAreaSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1">
                        {isAreasLoading ? (
                          <p className="animate-pulse py-2 text-center text-xs text-muted-foreground">
                            Searching...
                          </p>
                        ) : areasBatch?.data?.length ? (
                          areasBatch.data.map((area) => (
                            <button
                              key={area.id}
                              type="button"
                              className={cn(
                                "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                                String(field.state.value) === String(area.id) &&
                                  "bg-accent"
                              )}
                              onClick={() => {
                                field.handleChange(area.id)
                                setAreaOpen(false)
                                setAreaSearch("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 opacity-0",
                                  String(field.state.value) ===
                                    String(area.id) && "opacity-100"
                                )}
                              />
                              {area.area_name}
                            </button>
                          ))
                        ) : (
                          <p className="py-2 text-center text-xs text-muted-foreground italic">
                            Nothing found.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          <form.Field name="production_line_id">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              const selectedOption = linesBatch?.data?.find(
                (l) => String(l.id) === String(field.state.value)
              )

              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>Production Line</FieldLabel>
                  <Popover open={lineOpen} onOpenChange={setLineOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={lineOpen}
                        className="w-full justify-between text-left font-normal"
                        disabled={mutation.isPending}
                        aria-invalid={isInvalid}
                      >
                        {selectedOption
                          ? selectedOption.line_name
                          : "Select line..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent
                      className="w-[var(--radix-popover-trigger-width)] p-0"
                      align="start"
                    >
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                          className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                          placeholder="Search production line..."
                          value={lineSearch}
                          onChange={(e) => setLineSearch(e.target.value)}
                        />
                      </div>
                      <div className="max-h-60 overflow-y-auto p-1">
                        {isLinesLoading ? (
                          <p className="animate-pulse py-2 text-center text-xs text-muted-foreground">
                            Searching...
                          </p>
                        ) : linesBatch?.data?.length ? (
                          linesBatch.data.map((line) => (
                            <button
                              key={line.id}
                              type="button"
                              className={cn(
                                "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                                String(field.state.value) === String(line.id) &&
                                  "bg-accent"
                              )}
                              onClick={() => {
                                field.handleChange(line.id)
                                setLineOpen(false)
                                setLineSearch("")
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 opacity-0",
                                  String(field.state.value) ===
                                    String(line.id) && "opacity-100"
                                )}
                              />
                              {line.line_name}
                            </button>
                          ))
                        ) : (
                          <p className="py-2 text-center text-xs text-muted-foreground italic">
                            Nothing found.
                          </p>
                        )}
                      </div>
                    </PopoverContent>
                  </Popover>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        </div>
      </div>

      {/* SECTION 2: Target SKU Cart System */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            Target SKU Cart
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            disabled={mutation.isPending}
            onClick={() =>
              form.setFieldValue("items", (prev) => [
                ...prev,
                { sku_id: "", qty: "0" },
              ])
            }
          >
            <Plus className="h-4 w-4" /> Add Item Row
          </Button>
        </div>

        {/* 🛑 DUPLICATE ERROR DISPLAY BANNER */}
        <form.Subscribe selector={(state) => state.fieldMeta.items?.errors}>
          {(errors) =>
            errors && errors.length > 0 ? (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                {errors.join(", ")}
              </div>
            ) : null
          }
        </form.Subscribe>

        <div className="space-y-3">
          <form.Field name="items" mode="array">
            {(field) => (
              <>
                {field.state.value.map((_, index) => (
                  <div
                    key={index}
                    className="relative flex items-end gap-3 rounded-xl border bg-card/40 p-4 shadow-sm"
                  >
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
                      <div className="sm:col-span-2">
                        <form.Field name={`items[${index}].sku_id`}>
                          {(subField) => {
                            const isSubInvalid =
                              subField.state.meta.isTouched &&
                              !subField.state.meta.isValid

                            const selectedSkuOption = skusBatch?.data?.find(
                              (s) =>
                                String(s.id) === String(subField.state.value)
                            )

                            const currentRowOpen = skuOpenStates[index] || false
                            const currentRowSearch = skuSearchTerms[index] || ""

                            return (
                              <Field data-invalid={isSubInvalid}>
                                <FieldLabel className="text-xs text-muted-foreground">
                                  SKU Product Item #{index + 1}
                                </FieldLabel>

                                <Popover
                                  open={currentRowOpen}
                                  onOpenChange={(isOpen) => {
                                    setSkuOpenStates((prev) => ({
                                      ...prev,
                                      [index]: isOpen,
                                    }))
                                    if (isOpen) {
                                      setSkuSearchTerms((prev) => ({
                                        ...prev,
                                        [index]: "",
                                      }))
                                    }
                                  }}
                                >
                                  <PopoverTrigger asChild>
                                    <Button
                                      variant="outline"
                                      role="combobox"
                                      aria-expanded={currentRowOpen}
                                      className="w-full justify-between text-left font-normal"
                                      disabled={mutation.isPending}
                                      aria-invalid={isSubInvalid}
                                    >
                                      {selectedSkuOption
                                        ? `${selectedSkuOption.sku_code || ""} - ${selectedSkuOption.item_name}`
                                        : "Search & select SKU item..."}
                                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent
                                    className="w-[var(--radix-popover-trigger-width)] p-0"
                                    align="start"
                                  >
                                    <div className="flex items-center border-b px-3">
                                      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                                      <input
                                        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                                        placeholder="Type code or SKU item name..."
                                        value={currentRowSearch}
                                        onChange={(e) =>
                                          setSkuSearchTerms((prev) => ({
                                            ...prev,
                                            [index]: e.target.value,
                                          }))
                                        }
                                      />
                                    </div>
                                    <div className="max-h-60 overflow-y-auto p-1">
                                      {isSkusLoading ? (
                                        <p className="animate-pulse py-2 text-center text-xs text-muted-foreground">
                                          Searching SKU database...
                                        </p>
                                      ) : skusBatch?.data?.length ? (
                                        skusBatch.data.map((skuItem) => (
                                          <button
                                            key={skuItem.id}
                                            type="button"
                                            className={cn(
                                              "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                                              String(subField.state.value) ===
                                                String(skuItem.id) &&
                                                "bg-accent"
                                            )}
                                            onClick={() => {
                                              // Ensure tracking matches your validation string structure
                                              subField.handleChange(
                                                String(skuItem.id)
                                              )
                                              setSkuOpenStates((prev) => ({
                                                ...prev,
                                                [index]: false,
                                              }))
                                              setSkuSearchTerms((prev) => ({
                                                ...prev,
                                                [index]: "",
                                              }))
                                            }}
                                          >
                                            <Check
                                              className={cn(
                                                "mr-2 h-4 w-4 opacity-0",
                                                String(subField.state.value) ===
                                                  String(skuItem.id) &&
                                                  "opacity-100"
                                              )}
                                            />
                                            <div className="flex flex-col">
                                              <span className="font-medium">
                                                {skuItem.item_name}
                                              </span>
                                              {skuItem.sku_code && (
                                                <span className="text-[10px] text-muted-foreground">
                                                  {skuItem.sku_code}
                                                </span>
                                              )}
                                            </div>
                                          </button>
                                        ))
                                      ) : (
                                        <p className="py-2 text-center text-xs text-muted-foreground italic">
                                          No matching SKUs found.
                                        </p>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                <form.Subscribe
                                  selector={(state) =>
                                    state.fieldMeta[`items[${index}].sku_id`]
                                      ?.errors
                                  }
                                >
                                  {(errors) => <FieldError errors={errors} />}
                                </form.Subscribe>
                              </Field>
                            )
                          }}
                        </form.Field>
                      </div>

                      <div>
                        <form.Field name={`items[${index}].qty`}>
                          {(subField) => {
                            const isSubInvalid =
                              subField.state.meta.isTouched &&
                              !subField.state.meta.isValid
                            return (
                              <Field data-invalid={isSubInvalid}>
                                <FieldLabel className="text-xs text-muted-foreground">
                                  Quantity Produced
                                </FieldLabel>
                                <Input
                                  type="number"
                                  placeholder="0"
                                  aria-invalid={isSubInvalid}
                                  value={
                                    subField.state.value === "0"
                                      ? ""
                                      : subField.state.value
                                  }
                                  onChange={(e) => {
                                    subField.handleChange(e.target.value)
                                  }}
                                  disabled={mutation.isPending}
                                />
                                <form.Subscribe
                                  selector={(state) =>
                                    state.fieldMeta[`items[${index}].qty`]
                                      ?.errors
                                  }
                                >
                                  {(errors) => <FieldError errors={errors} />}
                                </form.Subscribe>
                              </Field>
                            )
                          }}
                        </form.Field>
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive"
                      // 🛡️ Safe ternary evaluation prevents Next.js hydration attribute drift errors
                      disabled={mutation.isPending}
                      onClick={() => {
                        form.setFieldValue("items", (prev) =>
                          prev.filter((_, i) => i !== index)
                        )

                        queueMicrotask(() => {
                          form.validate("submit")
                        })
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </>
            )}
          </form.Field>
        </div>
      </div>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="size-lg w-full"
      >
        {mutation.isPending ? "Processing..." : "Submit Production Batch"}
      </Button>
    </form>
  )
}
