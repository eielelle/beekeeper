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
  createSalesGroup,
  getSalesGroup,
  updateSalesGroup,
} from "./queries/sales_group.query"
import { salesGroupSchema } from "./schemas/sales_group.schema"

export function SalesGroupForm({
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
  const { data: salesGroupData, isLoading } = useQuery({
    queryKey: ["sales_groups", id],
    queryFn: () => getSalesGroup(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof salesGroupSchema>) => {
      if (isEditMode) {
        return updateSalesGroup({ ...values, id })
      }
      return createSalesGroup(values)
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
      name: salesGroupData?.name ?? "",
    },
    validators: {
      onSubmit: salesGroupSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading Sales Group details...
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
      <form.Field name="name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Sales Group Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Enterprise Sales, Regional Team A"
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
            ? "Update Sales Group"
            : "Create Sales Group"}
      </Button>
    </form>
  )
}
