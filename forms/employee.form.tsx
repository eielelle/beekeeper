"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams, useRouter } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import {
  createEmployee,
  getEmployee,
  updateEmployee,
} from "./queries/employee.query"
import { employeeSchema } from "./schemas/employee.schema"

export function EmployeeForm() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()

  const id = params?.id as string | undefined
  const isEditMode = !!id

  // 1. Fetch data if in edit mode
  const { data: employeeData, isLoading } = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployee(id!),
    enabled: isEditMode,
  })

  // 2. Handle mutations conditionally
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof employeeSchema>) => {
      if (isEditMode) {
        return updateEmployee({ ...values, id })
      }
      return createEmployee(values)
    },
    onSuccess: () => {
      // Invalidate query caches to instantly update list views across the app
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      router.refresh()
    },
  })

  // Handle loading state before initializing TanStack Form to prevent blank-value race conditions
  if (isEditMode && isLoading) {
    return (
      <div className="animate-pulse text-sm text-muted-foreground">
        Loading employee details...
      </div>
    )
  }

  return (
    <EmployeeFormInner
      initialData={employeeData}
      isEditMode={isEditMode}
      mutation={mutation}
    />
  )
}

// Inner form isolated component to guarantee defaultValues are safely bound after fetching
function EmployeeFormInner({
  initialData,
  isEditMode,
  mutation,
}: {
  initialData: any
  isEditMode: boolean
  mutation: any
}) {
  const form = useForm({
    defaultValues: {
      first_name: initialData?.first_name ?? "",
      last_name: initialData?.last_name ?? "",
      gender: initialData?.gender ?? "",
    },
    validators: {
      onSubmit: employeeSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
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
      {/* First Name Field */}
      <form.Field name="first_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                First Name <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Jane"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Last Name Field */}
      <form.Field name="last_name">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Last Name <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="e.g., Doe"
                autoComplete="off"
                disabled={mutation.isPending}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* Gender Field - shadcn/ui Select */}
      <form.Field name="gender">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Gender <span className="font-bold text-red-500">*</span>
              </FieldLabel>

              <Select
                value={field.state.value}
                onValueChange={(value) => field.handleChange(value)}
                disabled={mutation.isPending}
              >
                <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent onBlur={field.handleBlur}>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                </SelectContent>
              </Select>

              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <Button type="submit" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Employee"
            : "Add Employee"}
      </Button>
    </form>
  )
}
