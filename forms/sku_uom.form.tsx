"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { createSkuUom, getSkuUom, updateSkuUom } from "./queries/sku_uom.query"
import { skuUomSchema } from "./schemas/sku_uom.schema"

export function SkuUomForm() {
  const params = useParams()

  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: skuUomData, isLoading } = useQuery({
    queryKey: ["sku_uoms", id],
    queryFn: () => getSkuUom(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof skuUomSchema>) => {
      if (isEditMode) {
        return updateSkuUom({ ...values, id })
      }
      return createSkuUom(values)
    },
    onSuccess: () => {
      // Clear form on successful submission
      form.reset()
    },
  })

  // 3. Initialize Form
  const form = useForm({
    defaultValues: {
      uom_code: skuUomData?.uom_code ?? "",
      uom_name: skuUomData?.uom_name ?? "",
    },
    validators: {
      onSubmit: skuUomSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Handle loading state while fetching existing data
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading UOM details...
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
      <form.Field name="uom_code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                UOM Code
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., PCS, KG, BOX"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="uom_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                UOM Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Pieces, Kilograms, Box"
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
            ? "Update UOM"
            : "Create UOM"}
      </Button>
    </form>
  )
}
