"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  createVisitType,
  getVisitType,
  updateVisitType,
} from "./queries/visit_type.query"
import { visitTypeSchema } from "./schemas/visit_type.schema"

export function VisitTypeForm({
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

  // Fetch details for edit mode
  const { data: visitTypeData, isLoading: isLoadingVisitType } = useQuery({
    queryKey: ["visit_types", id],
    queryFn: () => getVisitType(id!),
    enabled: isEditMode,
  })

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof visitTypeSchema>) => {
      if (isEditMode) {
        return updateVisitType({
          ...values,
          id,
        })
      }
      return createVisitType(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) {
        onClose()
      }
    },
  })

  const dv: z.input<typeof visitTypeSchema> = {
    type_name: visitTypeData?.type_name ?? "",
    description: visitTypeData?.description ?? "",
  }

  const form = useForm({
    defaultValues: dv,
    validators: {
      onSubmit: visitTypeSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoadingVisitType) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading visit type details...</span>
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
      {/* TYPE NAME */}
      <form.Field name="type_name">
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
                placeholder="e.g., Routine Checkup"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* DESCRIPTION */}
      <form.Field name="description">
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
                placeholder="Briefly describe the purpose of this visit type..."
                disabled={mutation.isPending}
                rows={4}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* SUBMIT BUTTON */}
      <Button type="submit" disabled={mutation.isPending} className="w-full">
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Visit Type"
            : "Create Visit Type"}
      </Button>
    </form>
  )
}
