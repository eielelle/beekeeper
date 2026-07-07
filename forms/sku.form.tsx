"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Search } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// 🔌 Global Queries & Template Interceptors
import { createSku, getSku, updateSku } from "./queries/sku.query"
import { skuSchema } from "./schemas/sku.schema"
import { fetchSkuCategories } from "@/forms/queries/sku_category.query"
import { fetchSkuUoms } from "@/forms/queries/sku_uom.query"

export function SkuForm() {
  const params = useParams()
  const id = params?.id as string | undefined
  const isEditMode = !!id

  // --- 🔍 COMBOBOX FILTER & DEBOUNCE STATES ---
  const [categorySearch, setCategorySearch] = React.useState("")
  const debouncedCategorySearch = React.useDeferredValue(categorySearch)
  const [categoryOpen, setCategoryOpen] = React.useState(false)

  const [uomSearch, setUomSearch] = React.useState("")
  const debouncedUomSearch = React.useDeferredValue(uomSearch)
  const [uomOpen, setUomOpen] = React.useState(false)

  // 1. Fetch data if in edit mode
  const { data: skuData, isLoading } = useQuery({
    queryKey: ["skus", id],
    queryFn: () => getSku(id!),
    enabled: isEditMode,
  })

  // 2. Server-side paginated & debounced dropdown data streams
  const { data: categoriesBatch, isLoading: isCategoriesLoading } = useQuery({
    queryKey: ["sku_categories_combobox", debouncedCategorySearch],
    queryFn: () =>
      fetchSkuCategories({
        pageIndex: 0,
        pageSize: 10, // Server limits raw throughput payload size
        globalFilter: debouncedCategorySearch,
      }),
  })

  const { data: uomsBatch, isLoading: isUomsLoading } = useQuery({
    queryKey: ["sku_uoms_combobox", debouncedUomSearch],
    queryFn: () =>
      fetchSkuUoms({
        pageIndex: 0,
        pageSize: 10, // Only stream highest matches
        globalFilter: debouncedUomSearch,
      }),
  })

  // 3. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof skuSchema>) => {
      if (isEditMode) {
        return updateSku({ ...values, id })
      }
      return createSku(values)
    },
  })

  // 4. Initialize Form
  const form = useForm({
    defaultValues: {
      sku_category_id: "",
      sku_uom_id: "",
      item_name: "",
      item_description: "",
      sku_code: "",
      barcode: "",
    },
    validators: {
      onSubmit: skuSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Sync edits
  React.useEffect(() => {
    if (skuData) {
      form.setFieldValue("sku_category_id", skuData.sku_category_id)
      form.setFieldValue("sku_uom_id", skuData.sku_uom_id)
      form.setFieldValue("item_name", skuData.item_name)
      form.setFieldValue("item_description", skuData.item_description || "")
      form.setFieldValue("sku_code", skuData.sku_code)
      form.setFieldValue("barcode", skuData.barcode || "")
    }
  }, [skuData, form])

  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading SKU details...
      </div>
    )
  }

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <form.Field name="sku_code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                SKU Code <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., SKU-10024"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="item_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Item Name <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Premium Whole Wheat Bread"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* 🔍 ASYNC COMBOBOX: SKU CATEGORY */}
      <form.Field name="sku_category_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const selectedOption = categoriesBatch?.data?.find(
            (c) => c.id === field.state.value
          )

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                SKU Category <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={categoryOpen}
                    className="w-full justify-between text-left font-normal"
                    disabled={mutation.isPending}
                  >
                    {selectedOption
                      ? selectedOption.category_name
                      : "Select a category..."}
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
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Type code or category name..."
                      value={categorySearch}
                      onChange={(e) => setCategorySearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {isCategoriesLoading ? (
                      <p className="animate-pulse py-2 text-center text-xs text-muted-foreground">
                        Searching
                      </p>
                    ) : categoriesBatch?.data?.length ? (
                      categoriesBatch.data.map((category) => (
                        <button
                          key={category.id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                            field.state.value === category.id && "bg-accent"
                          )}
                          onClick={() => {
                            field.handleChange(category.id)
                            setCategoryOpen(false)
                            setCategorySearch("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 opacity-0",
                              field.state.value === category.id && "opacity-100"
                            )}
                          />
                          {category.category_name}
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

      {/* 🔍 ASYNC COMBOBOX: SKU UNIT OF MEASURE (UOM) */}
      <form.Field name="sku_uom_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          const selectedOption = uomsBatch?.data?.find(
            (u) => u.id === field.state.value
          )

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Unit of Measure (UOM){" "}
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Popover open={uomOpen} onOpenChange={setUomOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={uomOpen}
                    className="w-full justify-between text-left font-normal"
                    disabled={mutation.isPending}
                  >
                    {selectedOption ? selectedOption.uom : "Select a UOM..."}
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
                      className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Type UOM (e.g., Kg, Pcs)..."
                      value={uomSearch}
                      onChange={(e) => setUomSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-60 overflow-y-auto p-1">
                    {isUomsLoading ? (
                      <p className="animate-pulse py-2 text-center text-xs text-muted-foreground">
                        Searching...
                      </p>
                    ) : uomsBatch?.data?.length ? (
                      uomsBatch.data.map((uomItem) => (
                        <button
                          key={uomItem.id}
                          type="button"
                          className={cn(
                            "relative flex w-full cursor-default items-center rounded-sm px-2 py-1.5 text-left text-sm outline-none select-none hover:bg-accent hover:text-accent-foreground",
                            field.state.value === uomItem.id && "bg-accent"
                          )}
                          onClick={() => {
                            field.handleChange(uomItem.id)
                            setUomOpen(false)
                            setUomSearch("")
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4 opacity-0",
                              field.state.value === uomItem.id && "opacity-100"
                            )}
                          />
                          {uomItem.uom}
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

      <form.Field name="barcode">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Barcode</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., 4800000000000"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="item_description">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Item Description</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Enter raw material and packaging specifications..."
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update SKU"
            : "Create SKU"}
      </Button>
    </form>
  )
}
