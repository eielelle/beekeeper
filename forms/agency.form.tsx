"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { createAgency, getAgency, updateAgency } from "./queries/agency.query"
import { agencySchema } from "./schemas/agency.schema"

export function AgencyForm() {
  const params = useParams()

  const id = params?.id as string | undefined
  const isEditMode = !!id

  // Implicitly resolved active organization context
  const activeOrganizationId = "session-org-uuid"

  // 1. Fetch data if in edit mode
  const { data: agencyData, isLoading } = useQuery({
    queryKey: ["agencies", id],
    queryFn: () => getAgency(id!),
    enabled: isEditMode,
  })

  // 2. Conditional mutation handler
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof agencySchema>) => {
      const payload = {
        ...values,
        organization_id: agencyData?.organization_id || activeOrganizationId,
      }

      if (isEditMode) {
        return updateAgency({ ...payload, id })
      }
      return createAgency(payload)
    },
  })

  // 3. Form initialization
  const form = useForm({
    defaultValues: {
      agency_name: "",
      agency_description: "",
    },
    validators: {
      onSubmit: agencySchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Synchronize form when editing data lands
  React.useEffect(() => {
    if (agencyData) {
      form.setFieldValue("agency_name", agencyData.agency_name)
      form.setFieldValue(
        "agency_description",
        agencyData.agency_description || ""
      )
    }
  }, [agencyData, form])

  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading agency configurations...
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
      <form.Field name="agency_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Agency Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Regulatory Compliance Agency, Security Services"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="agency_description">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Agency Description</FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Optional description regarding the agency responsibility area..."
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
          ? "Saving..."
          : isEditMode
            ? "Update Agency Profile"
            : "Register Agency"}
      </Button>
    </form>
  )
}
