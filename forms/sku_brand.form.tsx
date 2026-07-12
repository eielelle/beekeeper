"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  createSkuBrand,
  getSkuBrand,
  updateSkuBrand,
} from "./queries/sku_brand.query"
import { skuBrandSchema } from "./schemas/sku_brand.schema"

export function SkuBrandForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()

  let id = params?.id as string | undefined
  if (editId) {
    id = editId
  }
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: skuBrandData, isLoading } = useQuery({
    queryKey: ["sku_brands", id],
    queryFn: () => getSkuBrand(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof skuBrandSchema>) => {
      if (isEditMode) {
        return updateSkuBrand({ ...values, id })
      }
      return createSkuBrand(values)
    },
    onSuccess: () => {
      form.reset()

      if (onClose) {
        onClose()
      }
    },
  })

  // 3. Initialize Form
  const form = useForm({
    defaultValues: {
      brand_name: skuBrandData?.brand_name ?? "",
    },
    validators: {
      onSubmit: skuBrandSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading SKU brand details...
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
      <form.Field name="brand_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Brand Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Nike, Samsung, Logitech"
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
            ? "Update SKU Brand"
            : "Create SKU Brand"}
      </Button>
    </form>
  )
}
