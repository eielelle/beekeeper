"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import * as z from "zod"
import { useParams, useRouter } from "next/navigation" // Added useRouter for redirects
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query" // Added useQuery and useQueryClient

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { outletTypeSchema } from "./schemas/outlet_type.schema"
import { Textarea } from "@/components/ui/textarea"
// Make sure to export getOutletType and updateOutletType from your query file
import {
  createOutletType,
  getOutletType,
  updateOutletType,
} from "./queries/outlet_type.query"

export function OutletTypeForm() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  // If your route is /outlet-types/[id], params.id will contain the ID string.
  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: outletType, isLoading } = useQuery({
    queryKey: ["outlet-type", id],
    queryFn: () => getOutletType(id!),
    enabled: isEditMode, // Only run this query if an ID exists
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof outletTypeSchema>) => {
      if (isEditMode) {
        return updateOutletType({ ...values, id })
      }
      return createOutletType(values)
    },
  })

  // 3. Initialize Form
  const form = useForm({
    // Use 'values' instead of 'defaultValues' so TanStack Form automatically
    // updates when the async data finishes loading from useQuery.
    defaultValues: {
      type_name: outletType?.type_name ?? "",
      type_description: outletType?.type_description ?? "",
    },
    validators: {
      onSubmit: outletTypeSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Handle loading state while fetching existing data
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading outlet type details...
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
      <form.Field name="type_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Outlet Type Name
                <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Kiosk, Flagship Store"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <form.Field name="type_description">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Outlet Type Description
              </FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Enter Description"
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
            ? "Update Outlet Type"
            : "Create Outlet Type"}
      </Button>
    </form>
  )
}
