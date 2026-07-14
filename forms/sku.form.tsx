"use client"

import * as React from "react"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useForm } from "@tanstack/react-form"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createSku,
  updateSku,
  fetchSkuById,
  fetchCategoriesLookup,
  fetchBrandsLookup,
  fetchUomsLookup,
} from "@/forms/queries/sku.query"

interface SkuFormProps {
  editId?: string
  onClose: () => void
}

export function SkuForm({ editId, onClose }: SkuFormProps) {
  const isEditMode = Boolean(editId)

  // --- Lookups Queries ---
  const { data: categories = [], isLoading: isLoadingCategories } = useQuery({
    queryKey: ["sku-categories-lookup"],
    queryFn: fetchCategoriesLookup,
  })

  const { data: brands = [], isLoading: isLoadingBrands } = useQuery({
    queryKey: ["brands-lookup"],
    queryFn: fetchBrandsLookup,
  })

  const { data: uoms = [], isLoading: isLoadingUoms } = useQuery({
    queryKey: ["uoms-lookup"],
    queryFn: fetchUomsLookup,
  })

  // --- Fetch Single SKU for Editing ---
  const { data: skuData, isLoading: isLoadingSku } = useQuery({
    queryKey: ["sku", editId],
    queryFn: () => fetchSkuById(editId!),
    enabled: isEditMode,
  })

  // Wait until required data is fetched
  const isLoadingData =
    (isEditMode && (isLoadingSku || !skuData)) ||
    isLoadingCategories ||
    isLoadingBrands ||
    isLoadingUoms

  if (isLoadingData) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading SKU details...
      </div>
    )
  }

  // Remount inner form when editId or skuData changes to ensure defaultValues hit on first render
  return (
    <SkuFormContent
      key={editId ?? "create"}
      editId={editId}
      skuData={skuData}
      categories={categories}
      brands={brands}
      uoms={uoms}
      onClose={onClose}
    />
  )
}

interface SkuFormContentProps extends SkuFormProps {
  skuData?: any
  categories: any[]
  brands: any[]
  uoms: any[]
}

function SkuFormContent({
  editId,
  skuData,
  categories,
  brands,
  uoms,
  onClose,
}: SkuFormContentProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  // --- Mutation ---
  const mutation = useMutation({
    mutationFn: (values: any) => {
      if (isEditMode && editId) {
        return updateSku(editId, values)
      }
      return createSku(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["skus"] })
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["sku", editId] })
      }
      onClose()
    },
  })

  // --- Form Setup with fully initialized defaultValues ---
  const form = useForm({
    defaultValues: {
      sku_code: skuData?.sku_code ?? "",
      item_name: skuData?.item_name ?? "",
      barcode: skuData?.barcode ?? "",
      sku_category_id: skuData?.sku_category_id
        ? String(skuData.sku_category_id)
        : "",
      brand_id: skuData?.brand_id ? String(skuData.brand_id) : "",
      sku_uom_id: skuData?.sku_uom_id ? String(skuData.sku_uom_id) : "",
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync({
        sku_code: value.sku_code,
        item_name: value.item_name,
        barcode: value.barcode || null,
        sku_category_id: value.sku_category_id
          ? Number(value.sku_category_id)
          : null,
        brand_id: value.brand_id ? Number(value.brand_id) : null,
        sku_uom_id: value.sku_uom_id ? Number(value.sku_uom_id) : null,
      })
    },
  })

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
      className="space-y-4"
    >
      {/* SKU Code */}
      <form.Field name="sku_code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>
                SKU Code <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. SKU-10001"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Item Name */}
      <form.Field name="item_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>
                Item Name <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Enter item name"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Barcode */}
      <form.Field name="barcode">
        {(field) => (
          <Field>
            <FieldLabel>Barcode</FieldLabel>
            <Input
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Optional barcode"
              disabled={mutation.isPending}
            />
          </Field>
        )}
      </form.Field>

      {/* Category Select */}
      <form.Field name="sku_category_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>Category</FieldLabel>
              <Select
                value={
                  field.state.value ? String(field.state.value) : undefined
                }
                onValueChange={(val) => field.handleChange(val)}
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.category_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Brand Select */}
      <form.Field name="brand_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>Brand</FieldLabel>
              <Select
                value={
                  field.state.value ? String(field.state.value) : undefined
                }
                onValueChange={(val) => field.handleChange(val)}
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select brand" />
                </SelectTrigger>
                <SelectContent>
                  {brands.map((b: any) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.brand_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* UOM Select */}
      <form.Field name="sku_uom_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel>UOM</FieldLabel>
              <Select
                value={
                  field.state.value ? String(field.state.value) : undefined
                }
                onValueChange={(val) => field.handleChange(val)}
                disabled={mutation.isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select UOM" />
                </SelectTrigger>
                <SelectContent>
                  {uoms.map((u: any) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.uom_code} - {u.uom_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Form Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Saving..."
            : isEditMode
              ? "Update SKU"
              : "Create SKU"}
        </Button>
      </div>
    </form>
  )
}
