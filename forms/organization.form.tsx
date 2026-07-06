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

export function OrganizationForm() {
  const params = useParams()

  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: orgData, isLoading } = useQuery({
    queryKey: ["organizations", id],
    queryFn: () => getOrganization(id!),
    enabled: isEditMode,
  })

  // 2. Conditional mutation handler
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof organizationSchema>) => {
      const payload = {
        ...values,
      }

      if (isEditMode) {
        return updateOrganization({ ...payload, id })
      }
      return createOrganization(payload)
    },
  })

  // 3. Form initialization
  const form = useForm({
    defaultValues: {
      organization_name: "",
    },
    validators: {
      onSubmit: organizationSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Synchronize form values when edit target data resolves
  React.useEffect(() => {
    if (orgData) {
      form.setFieldValue("organization_name", orgData.organization_name)
    }
  }, [orgData, form])

  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading organization configurations...
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
      <form.Field name="organization_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Organization Branch Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., North Region Plant, Logistics Division"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full sm:w-auto"
      >
        {mutation.isPending
          ? "Saving structural tier..."
          : isEditMode
            ? "Update Organization Tier"
            : "Create Structural Node"}
      </Button>
    </form>
  )
}
