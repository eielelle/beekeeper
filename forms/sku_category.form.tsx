"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  createSkuCategory,
  getSkuCategory,
  updateSkuCategory,
} from "./queries/sku_category.query"
import { skuCategorySchema } from "./schemas/sku_category.schema"

export function SkuCategoryForm({
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
  const { data: skuCategoryData, isLoading } = useQuery({
    queryKey: ["sku_categories", id],
    queryFn: () => getSkuCategory(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof skuCategorySchema>) => {
      if (isEditMode) {
        return updateSkuCategory({ ...values, id })
      }
      return createSkuCategory(values)
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
      category_name: skuCategoryData?.category_name ?? "",
      category_description: skuCategoryData?.category_description ?? "",
    },
    validators: {
      onSubmit: skuCategorySchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading SKU category details...
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
      <form.Field name="category_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Category Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Electronics, Beverages"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="category_description">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Enter category description details..."
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
            ? "Update SKU Category"
            : "Create SKU Category"}
      </Button>
    </form>
  )
}
