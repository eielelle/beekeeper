"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  createWorkType,
  getWorkType,
  updateWorkType,
} from "./queries/work_type.query"
import { workTypeSchema } from "./schemas/work_type.schema"

interface WorkTypeFormProps {
  editId?: string
  onClose: () => void
}

export function WorkTypeForm({ editId, onClose }: WorkTypeFormProps) {
  const isEditMode = Boolean(editId)

  // 1. Fetch data if in edit mode
  const { data: workTypeData, isLoading } = useQuery({
    queryKey: ["work_types", editId],
    queryFn: () => getWorkType(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !workTypeData)) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading work type details...
      </div>
    )
  }

  // Key remount forces fresh initialization with defaultValues on open
  return (
    <WorkTypeFormContent
      key={editId ?? "create"}
      editId={editId}
      workTypeData={workTypeData}
      onClose={onClose}
    />
  )
}

interface WorkTypeFormContentProps extends WorkTypeFormProps {
  workTypeData?: { name: string }
}

function WorkTypeFormContent({
  editId,
  workTypeData,
  onClose,
}: WorkTypeFormContentProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  // Handle mutations
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof workTypeSchema>) => {
      if (isEditMode && editId) {
        return updateWorkType({ ...values, id: editId })
      }
      return createWorkType(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["work_types"] })
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["work_types", editId] })
      }
      onClose()
    },
  })

  // Initialize Form
  const form = useForm({
    defaultValues: {
      name: workTypeData?.name ?? "",
    },
    validators: {
      onSubmit: workTypeSchema,
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
              ? "Update Work Type"
              : "Create Work Type"}
        </Button>
      </div>
    </form>
  )
}
