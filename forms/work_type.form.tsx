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
  createWorkType,
  getWorkType,
  updateWorkType,
} from "./queries/work_type.query"
import { workTypeSchema } from "./schemas/work_type.schema"

export function WorkTypeForm() {
  const params = useParams()

  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: workTypeData, isLoading } = useQuery({
    queryKey: ["work_types", id],
    queryFn: () => getWorkType(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof workTypeSchema>) => {
      if (isEditMode) {
        return updateWorkType({ ...values, id })
      }
      return createWorkType(values)
    },
    onSuccess: () => {
      // Clear form on successful submission
      form.reset()
    },
  })

  // 3. Initialize Form
  const form = useForm({
    defaultValues: {
      name: workTypeData?.name ?? "",
    },
    validators: {
      onSubmit: workTypeSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Handle loading state while fetching existing data
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading work type details...
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
                Work Type Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., On-site, Remote, Hybrid"
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
            ? "Update Work Type"
            : "Create Work Type"}
      </Button>
    </form>
  )
}
