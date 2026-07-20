"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

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
import { toast } from "sonner"

import { getEmployee, updateEmployee } from "./queries/employee.query"
import { employeeSchema } from "./schemas/employee.schema"
import { Checkbox } from "@/components/ui/checkbox"

export function EmployeeForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const queryClient = useQueryClient()
  const params = useParams()

  let id = params?.id as string | undefined
  if (editId) {
    id = editId
  }
  const isEditMode = !!id

  // Fetch Employee details for edit mode
  const { data: employeeData, isLoading: isLoadingEmployee } = useQuery({
    queryKey: ["employees", id],
    queryFn: () => getEmployee(id!),
    enabled: isEditMode,
  })

  // --- MUTATION ---
  const mutation = useMutation({
    mutationFn: async (
      values: z.infer<typeof employeeSchema> & {
        gender?: string
        employment_start?: string
        birthdate?: string
        is_superuser?: boolean // <-- Added
      }
    ) => {
      if (isEditMode) {
        // Edit Mode: Update database normally
        return updateEmployee({
          ...values,
          id,
        })
      } else {
        // Create Mode: Hit your API route to create Auth User + Profile

        // Auto-generate password: lowercase last_name + birthdate (YYYYMMDD)
        // e.g., "cruz" + "1990-05-15" -> "cruz19900515"
        const formattedDate = values.birthdate
          ? values.birthdate.replace(/-/g, "")
          : ""
        const generatedPassword = `${values.last_name.toLowerCase().replace(/\s+/g, "")}${formattedDate}`

        const apiPayload = {
          ...values,
          password: generatedPassword,
        }

        const res = await fetch("/api/v1/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(apiPayload),
        })

        if (!res.ok) {
          const errData = await res.json()
          throw new Error(errData.error || "Failed to create user account.")
        }

        return await res.json()
      }
    },
    onSuccess: () => {
      toast.success(
        isEditMode ? "Employee updated." : "User account created successfully."
      )
      queryClient.invalidateQueries({ queryKey: ["employees"] })
      form.reset()
      if (onClose) {
        onClose()
      }
    },
    onError: (error: any) => {
      toast.error(error.message)
    },
  })

  // --- FORM SETUP ---
  const dv = {
    employee_no: employeeData?.employee_no ?? "",
    first_name: employeeData?.first_name ?? "",
    middle_name: employeeData?.middle_name ?? "",
    last_name: employeeData?.last_name ?? "",
    email: employeeData?.email ?? "",
    phone: employeeData?.phone ?? "",
    gender: employeeData?.gender ?? "",
    employment_start: employeeData?.employment_start ?? "",
    birthdate: employeeData?.birthdate ?? "",
    is_superuser: employeeData?.is_superuser ?? false, // <-- Added
  }

  const form = useForm({
    defaultValues: dv,
    validators: {
      onSubmit: employeeSchema as any,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoadingEmployee) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading employee details...</span>
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* EMPLOYEE NO */}
        <form.Field name="employee_no">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Employee Number{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                  placeholder="e.g., EMP-001"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* EMPLOYMENT START */}
        {!isEditMode && (
          <form.Field name="employment_start">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Start Date{" "}
                    <span className="font-bold text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* FIRST NAME */}
        <form.Field name="first_name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  First Name{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Juan"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* MIDDLE NAME */}
        <form.Field name="middle_name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Middle Name</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Dela"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* LAST NAME */}
        <form.Field name="last_name">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Last Name{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Cruz"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* EMAIL */}
        <form.Field name="email">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Email Address{" "}
                  <span className="font-bold text-destructive">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  type="email"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="juan@example.com"
                  disabled={mutation.isPending || isEditMode} // Usually shouldn't change email after auth creation
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        {/* PHONE */}
        <form.Field name="phone">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Phone Number</FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="09123456789"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* BIRTHDATE */}
        {!isEditMode && (
          <form.Field name="birthdate">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Birthdate{" "}
                    <span className="font-bold text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="date"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        )}

        {/* GENDER */}
        {!isEditMode && (
          <form.Field name="gender">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>
                    Gender <span className="font-bold text-destructive">*</span>
                  </FieldLabel>
                  <Select
                    value={field.state.value}
                    onValueChange={(val) => field.handleChange(val)}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>
        )}

        {/* SUPERUSER CHECKBOX */}
        <form.Field name="is_superuser">
          {(field) => (
            <Field className="flex flex-col gap-2 pt-2">
              <div className="flex items-start gap-3">
                <Checkbox
                  id={field.name}
                  checked={field.state.value}
                  onCheckedChange={(checked) =>
                    field.handleChange(checked === true)
                  }
                  className="mt-0.5"
                  disabled={mutation.isPending}
                />
                <div className="flex flex-col space-y-1.5 leading-none">
                  <FieldLabel htmlFor={field.name} className="cursor-pointer">
                    Superuser Access
                  </FieldLabel>
                  <p className="text-xs text-muted-foreground">
                    Grants full administrative privileges to this employee.
                  </p>
                </div>
              </div>
            </Field>
          )}
        </form.Field>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditMode ? "Update Employee" : "Create Employee Account"}
        </Button>
      </div>
    </form>
  )
}
