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
  createPosition,
  getPosition,
  updatePosition,
} from "./queries/position.query"
import { positionSchema } from "./schemas/position.schema"

export function PositionForm() {
  const params = useParams()

  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: positionData, isLoading } = useQuery({
    queryKey: ["positions", id],
    queryFn: () => getPosition(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof positionSchema>) => {
      if (isEditMode) {
        return updatePosition({ ...values, id })
      }
      return createPosition(values)
    },
    onSuccess: () => {
      // Clear form on successful submission
      form.reset()
    },
  })

  // 3. Initialize Form
  const form = useForm({
    defaultValues: {
      title: positionData?.title ?? "",
      code: positionData?.code ?? "",
    },
    validators: {
      onSubmit: positionSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Handle loading state while fetching existing data
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading position details...
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

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Position"
            : "Create Position"}
      </Button>
    </form>
  )
}
