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
  createOrganization,
  getOrganization,
  updateOrganization,
} from "./queries/organization.query"
import { organizationSchema } from "./schemas/organization.schema"

export function OrganizationForm({
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
  const { data: organizationData, isLoading } = useQuery({
    queryKey: ["organizations", id],
    queryFn: () => getOrganization(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof organizationSchema>) => {
      if (isEditMode) {
        return updateOrganization({ ...values, id })
      }
      return createOrganization(values)
    },
    onSuccess: () => {
      form.reset()

      if (onClose) {
        onClose()
      }
    },
  })

  // 3. Initialize Form
  const form = useForm({
    defaultValues: {
      organization_name: organizationData?.organization_name ?? "",
      organization_code: organizationData?.organization_code ?? "",
    },
    validators: {
      onSubmit: organizationSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading organization details...
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
      <form.Field name="organization_code">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Organization Code
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) =>
                  field.handleChange(e.target.value.toUpperCase())
                }
                aria-invalid={isInvalid}
                placeholder="e.g., ORG-001, ACME-CORP"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="organization_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Organization Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Acme Corporation"
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
            ? "Update Organization"
            : "Create Organization"}
      </Button>
    </form>
  )
}
