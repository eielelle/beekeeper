"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  createEmploymentStatus,
  getEmploymentStatus,
  updateEmploymentStatus,
} from "./queries/employment_status.query"
import { employmentStatusSchema } from "./schemas/employment_status.schema"

interface EmploymentStatusFormProps {
  editId?: string
  onClose: () => void
}

export function EmploymentStatusForm({
  editId,
  onClose,
}: EmploymentStatusFormProps) {
  const isEditMode = Boolean(editId)

  // 1. Fetch data if in edit mode
  const { data: employmentStatusData, isLoading } = useQuery({
    queryKey: ["employment_statuses", editId],
    queryFn: () => getEmploymentStatus(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !employmentStatusData)) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading employment status details...
      </div>
    )
  }

  // Key remount forces fresh initialization with defaultValues on open
  return (
    <EmploymentStatusFormContent
      key={editId ?? "create"}
      editId={editId}
      employmentStatusData={employmentStatusData}
      onClose={onClose}
    />
  )
}

interface EmploymentStatusFormContentProps extends EmploymentStatusFormProps {
  employmentStatusData?: { name: string }
}

function EmploymentStatusFormContent({
  editId,
  employmentStatusData,
  onClose,
}: EmploymentStatusFormContentProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  // Handle mutations
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof employmentStatusSchema>) => {
      if (isEditMode && editId) {
        return updateEmploymentStatus({ ...values, id: editId })
      }
      return createEmploymentStatus(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["employment_statuses"] })
      if (editId) {
        queryClient.invalidateQueries({
          queryKey: ["employment_statuses", editId],
        })
      }
      onClose()
    },
  })

  // Initialize Form
  const form = useForm({
    defaultValues: {
      name: employmentStatusData?.name ?? "",
    },
    validators: {
      onSubmit: employmentStatusSchema,
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
                Status Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Active, Suspended, Terminated"
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
              ? "Update Employment Status"
              : "Create Employment Status"}
        </Button>
      </div>
    </form>
  )
}
