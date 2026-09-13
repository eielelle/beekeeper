"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import { createLeave, getLeave, updateLeave } from "./queries/leave.query"
import { leaveSchema, LeaveFormValues } from "./schemas/leave.schema"

export function LeaveForm({ editId }: { editId?: string }) {
  const isEditMode = Boolean(editId)

  const { data: leaveData, isLoading } = useQuery({
    queryKey: ["leaves", editId],
    queryFn: () => getLeave(editId!),
    enabled: isEditMode,
  })

  if (isEditMode && (isLoading || !leaveData)) {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        Loading leave details...
      </div>
    )
  }

  return (
    <LeaveFormContent
      key={editId ?? "create"}
      editId={editId}
      leaveData={leaveData}
    />
  )
}

function LeaveFormContent({ editId, leaveData }: any) {
  const queryClient = useQueryClient()
  const isEditMode = Boolean(editId)

  const mutation = useMutation({
    mutationFn: (values: LeaveFormValues) => {
      if (isEditMode && editId) {
        return updateLeave({ ...values, id: editId })
      }
      return createLeave(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leaves"] })
      if (editId) {
        queryClient.invalidateQueries({ queryKey: ["leaves", editId] })
      }
    },
  })

  const form = useForm({
    defaultValues: {
      leave_date_from: leaveData?.leave_date_from ?? "",
      leave_date_to: leaveData?.leave_date_to ?? "",
      reason: leaveData?.reason ?? "",
      status: leaveData?.status ?? "pending",
    },
    validators: {
      onChange: leaveSchema as any,
    },
    onSubmit: async ({ value }) => {
      await mutation.mutateAsync(value)
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <form.Field name="leave_date_from">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  From Date <span className="font-bold text-red-500">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
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

        <form.Field name="leave_date_to">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  To Date <span className="font-bold text-red-500">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
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
      </div>

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
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="State the reason for your leave request..."
                disabled={mutation.isPending}
                className="resize-none"
                rows={3}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending
            ? "Submitting..."
            : isEditMode
              ? "Update Leave Request"
              : "Submit Leave Request"}
        </Button>
      </div>
    </form>
  )
}
