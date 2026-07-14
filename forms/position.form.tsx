"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import {
  createPosition,
  getPosition,
  updatePosition,
} from "./queries/position.query"
import { positionSchema } from "./schemas/position.schema"

interface PositionFormProps {
  editId?: string
  onClose: () => void
}

export function PositionForm({ editId, onClose }: PositionFormProps) {
  const isEditMode = Boolean(editId)

  // 1. Fetch data if in edit mode
  const { data: positionData, isLoading } = useQuery({
    queryKey: ["positions", editId],
    queryFn: () => getPosition(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !positionData)) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading position details...
      </div>
    )
  }

  // Key remount forces fresh initialization with defaultValues on open
  return (
    <PositionFormContent
      key={editId ?? "create"}
      editId={editId}
      positionData={positionData}
      onClose={onClose}
    />
  )
}

interface PositionFormContentProps extends PositionFormProps {
  positionData?: { title: string; code: string }
}

function PositionFormContent({
  editId,
  positionData,
  onClose,
}: PositionFormContentProps) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  // Handle mutations
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof positionSchema>) => {
      if (isEditMode && editId) {
        return updatePosition({ ...values, id: editId })
      }
      return createPosition(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["positions"] })
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["positions", editId] })
      }
      onClose()
    },
  })

  // Initialize Form
  const form = useForm({
    defaultValues: {
      title: positionData?.title ?? "",
      code: positionData?.code ?? "",
    },
    validators: {
      onSubmit: positionSchema,
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
      <form.Field name="title">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Position Title
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Software Engineer"
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
              <FieldLabel htmlFor={field.name}>Position Code</FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., SWE-01"
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
              ? "Update Position"
              : "Create Position"}
        </Button>
      </div>
    </form>
  )
}
