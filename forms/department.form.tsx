"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  createDepartment,
  getDepartment,
  updateDepartment,
} from "./queries/department.query"
import { departmentSchema } from "./schemas/department.schema"

interface DepartmentFormProps {
  editId?: string
  onClose: () => void
}

export function DepartmentForm({ editId, onClose }: DepartmentFormProps) {
  const isEditMode = Boolean(editId)

  // 1. Fetch data if in edit mode
  const { data: departmentData, isLoading } = useQuery({
    queryKey: ["departments", editId],
    queryFn: () => getDepartment(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !departmentData)) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading department details...
      </div>
    )
  }

  // Key remount forces fresh initialization with defaultValues on open
  return (
    <DepartmentFormContent
      key={editId ?? "create"}
      editId={editId}
      departmentData={departmentData}
      onClose={onClose}
    />
  )
}

interface DepartmentFormContentProps extends DepartmentFormProps {
  departmentData?: { name: string; code: string }
}

function DepartmentFormContent({
  editId,
  departmentData,
  onClose,
}: DepartmentFormContentProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  // Handle mutations
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof departmentSchema>) => {
      if (isEditMode && editId) {
        return updateDepartment({ ...values, id: editId })
      }
      return createDepartment(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] })
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["departments", editId] })
      }
      onClose()
    },
  })

  // Initialize Form
  const form = useForm({
    defaultValues: {
      name: departmentData?.name ?? "",
      code: departmentData?.code ?? "",
    },
    validators: {
      onSubmit: departmentSchema,
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
                Department Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Human Resources"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Department Code
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., HR"
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
              ? "Update Department"
              : "Create Department"}
        </Button>
      </div>
    </form>
  )
}
