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
  createShiftType,
  getShiftType,
  updateShiftType,
} from "./queries/shift_type.query"
import { shiftTypeSchema } from "./schemas/shift_type.schema"

export function ShiftTypeForm() {
  const params = useParams()

  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: shiftTypeData, isLoading } = useQuery({
    queryKey: ["shift_types", id],
    queryFn: () => getShiftType(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof shiftTypeSchema>) => {
      if (isEditMode) {
        return updateShiftType({ ...values, id })
      }
      return createShiftType(values)
    },
    onSuccess: () => {
      // Clear form on successful submission
      form.reset()
    },
  })

  // 3. Initialize Form
  const form = useForm({
    defaultValues: {
      name: shiftTypeData?.name ?? "",
      start_time: shiftTypeData?.start_time ?? "",
      end_time: shiftTypeData?.end_time ?? "",
    },
    validators: {
      onSubmit: shiftTypeSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Handle loading state while fetching existing data
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading shift type details...
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
                Shift Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Morning Shift, Night Shift"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="start_time">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Start Time
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="time"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="end_time">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                End Time
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                type="time"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
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
            ? "Update Shift Type"
            : "Create Shift Type"}
      </Button>
    </form>
  )
}
