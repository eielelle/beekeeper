"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery } from "@tanstack/react-query"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import {
  createMyLeave,
  getMyLeave,
  updateMyLeave,
} from "./queries/my-leave.query"
import { myLeaveSchema } from "@/forms/schemas/my_leave.schema"

export function MyLeaveForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const isEditMode = !!editId

  // Fetch details if edit mode
  const { data: leaveData, isLoading: isLoadingLeave } = useQuery({
    queryKey: ["my-leaves", editId],
    queryFn: () => getMyLeave(editId!),
    enabled: isEditMode,
  })

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof myLeaveSchema>) => {
      if (isEditMode) {
        return updateMyLeave({ ...values, id: editId })
      }
      return createMyLeave(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })

  const form = useForm({
    defaultValues: {
      leave_date: leaveData?.leave_date ?? "",
      reason: leaveData?.reason ?? "",
    },
    validators: {
      onSubmit: myLeaveSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // Populate form when edit data loads
  useEffect(() => {
    if (leaveData) {
      form.reset({
        leave_date: leaveData.leave_date,
        reason: leaveData.reason,
      })
    }
  }, [leaveData])

  if (isEditMode && isLoadingLeave) {
    return (
      <div className="flex items-center space-x-2 p-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading leave details...</span>
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
      {/* LEAVE DATE */}
      <form.Field name="leave_date">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Leave Date <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                type="date"
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

      {/* REASON */}
      <form.Field name="reason">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Reason <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Enter leave reason..."
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
            ? "Update Leave"
            : "File Leave"}
      </Button>
    </form>
  )
}
