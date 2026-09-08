"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Assumed imports based on the established directory pattern
import {
  createTicket,
  getTicket,
  updateTicket,
  getTicketStatusOptions,
} from "./queries/ticket.query"
import { ticketSchema } from "./schemas/ticket.schema"

export function TicketForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()
  const id = editId || (params?.id as string | undefined)
  const isEditMode = !!id

  // Fetch relational ticket statuses
  const { data: statusOptions = [], isLoading: isLoadingStatuses } = useQuery({
    queryKey: ["ticket-statuses"],
    queryFn: getTicketStatusOptions,
  })

  // Fetch Ticket details for edit mode
  const { data: ticketData, isLoading: isLoadingTicket } = useQuery({
    queryKey: ["tickets", id],
    queryFn: () => getTicket(id!),
    enabled: isEditMode,
  })

  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof ticketSchema>) => {
      if (isEditMode) {
        return updateTicket({ ...values, id })
      }
      return createTicket(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })

  const form = useForm({
    defaultValues: {
      title: ticketData?.title ?? "",
      description: ticketData?.description ?? "",
      ticket_status_id: ticketData?.ticket_status_id?.toString() ?? "",
    },
    validators: {
      onSubmit: ticketSchema,
    },
    onSubmit: async ({ value }) => {
      // Cast the stringified Select value back to a number for the database
      mutation.mutate({
        ...value,
        ticket_status_id: Number(value.ticket_status_id),
      })
    },
  })

  // Safely hydrate the form once the async data arrives
  React.useEffect(() => {
    if (ticketData) {
      form.reset({
        title: ticketData.title,
        description: ticketData.description,
        ticket_status_id: ticketData.ticket_status_id.toString(),
      })
    }
  }, [ticketData])

  if (isEditMode && isLoadingTicket) {
    return (
      <div className="flex items-center justify-center space-x-2 p-8 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading ticket details...</span>
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
      {/* TITLE FIELD */}
      <form.Field name="title">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Title <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Input
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Brief issue summary"
                disabled={mutation.isPending}
                autoComplete="off"
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* DESCRIPTION FIELD */}
      <form.Field name="description">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Description <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Textarea
                id={field.name}
                name={field.name}
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                aria-invalid={isInvalid}
                placeholder="Detailed explanation of the issue..."
                disabled={mutation.isPending}
                rows={4}
              />
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* TICKET STATUS FIELD */}
      <form.Field name="ticket_status_id">
        {(field) => {
          const isInvalid =
            field.state.meta.isTouched && !field.state.meta.isValid

          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>
                Status <span className="font-bold text-red-500">*</span>
              </FieldLabel>
              <Select
                value={field.state.value}
                disabled={isLoadingStatuses || mutation.isPending}
                onValueChange={(val) => field.handleChange(val)}
              >
                <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(
                    (status: { label: string; value: string }) => (
                      <SelectItem key={status.value} value={status.value}>
                        {status.label}
                      </SelectItem>
                    )
                  )}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          )
        }}
      </form.Field>

      {/* SUBMIT BUTTON */}
      <Button
        type="submit"
        disabled={mutation.isPending}
        className="w-full sm:w-auto"
      >
        {mutation.isPending
          ? "Saving..."
          : isEditMode
            ? "Update Ticket"
            : "Create Ticket"}
      </Button>
    </form>
  )
}
