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
  createExpenseType,
  getExpenseType,
  updateExpenseType,
} from "./queries/expense_type.query"
import { expenseTypeSchema } from "./schemas/expense_type.schema"

export function ExpenseTypeForm({
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
  const { data: expenseTypeData, isLoading } = useQuery({
    queryKey: ["expense_types", id],
    queryFn: () => getExpenseType(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof expenseTypeSchema>) => {
      if (isEditMode) {
        return updateExpenseType({ ...values, id })
      }
      return createExpenseType(values)
    },
    onSuccess: () => {
      // Clear/reset form fields on successful creation/update
      form.reset()

      if (onClose) {
        onClose()
      }
    },
  })

  // 3. Initialize Form
  const form = useForm({
    defaultValues: {
      type_name: expenseTypeData?.type_name ?? "",
      type_description: expenseTypeData?.type_description ?? "",
    },
    validators: {
      onSubmit: expenseTypeSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Handle loading state while fetching existing data
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading expense type details...
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
      <form.Field name="type_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Expense Type Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Office Supplies"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="type_description">
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
                placeholder="Enter description details here..."
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
            ? "Update Expense Type"
            : "Create Expense Type"}
      </Button>
    </form>
  )
}
