"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  createEmploymentType,
  getEmploymentType,
  updateEmploymentType,
} from "./queries/employment_type.query"
import { employmentTypeSchema } from "./schemas/employment_type.schema"

interface EmploymentTypeFormProps {
  editId?: string
  onClose: () => void
}

export function EmploymentTypeForm({
  editId,
  onClose,
}: EmploymentTypeFormProps) {
  const isEditMode = Boolean(editId)

  // 1. Fetch data if in edit mode
  const { data: employmentTypeData, isLoading } = useQuery({
    queryKey: ["employment_types", editId],
    queryFn: () => getEmploymentType(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !employmentTypeData)) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading employment type details...
      </div>
    )
  }

  // Key remount forces fresh initialization with defaultValues on open
  return (
    <EmploymentTypeFormContent
      key={editId ?? "create"}
      editId={editId}
      employmentTypeData={employmentTypeData}
      onClose={onClose}
    />
  )
}

interface EmploymentTypeFormContentProps extends EmploymentTypeFormProps {
  employmentTypeData?: { name: string }
}

function EmploymentTypeFormContent({
  editId,
  employmentTypeData,
  onClose,
}: EmploymentTypeFormContentProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  // Handle mutations
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof employmentTypeSchema>) => {
      if (isEditMode && editId) {
        return updateEmploymentType({ ...values, id: editId })
      }
      return createEmploymentType(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment_types"] })
      if (editId) {
        queryClient.invalidateQueries({
          queryKey: ["employment_types", editId],
        })
      }
      onClose()
    },
  })

  // Initialize Form
  const form = useForm({
    defaultValues: {
      name: employmentTypeData?.name ?? "",
    },
    validators: {
      onSubmit: employmentTypeSchema,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
    },
  })

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
                Type Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Regular, Permanent, Temporary"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

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
              ? "Update Employment Type"
              : "Create Employment Type"}
        </Button>
      </div>
    </form>
  )
}
