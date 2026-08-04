"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Paperclip } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

import {
  createExpense,
  getExpense,
  updateExpense,
  fetchExpenseTypesOptions,
  ExpenseRecord,
  ExpenseAttachmentRecord,
} from "@/forms/queries/expense.query"
import {
  ExpenseAttachmentValues,
  expenseSchema,
} from "@/forms/schemas/expense.schema"

export function ExpenseForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()
  const queryClient = useQueryClient()

  let id = editId
  if (!id && params?.id) {
    id = Array.isArray(params.id) ? params.id[0] : params.id
  }
  const isEditMode = !!id

  // Combobox Popover State
  const [isTypeOpen, setIsTypeOpen] = React.useState(false)

  // 1. Queries
  const { data: expenseData, isLoading: isExpenseLoading } = useQuery({
    queryKey: ["expenses", id],
    queryFn: () => getExpense(id!),
    enabled: isEditMode,
  })

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ["expense_types_options"],
    queryFn: fetchExpenseTypesOptions,
  })

  // 2. Mutations
  const mutation = useMutation<any, Error, z.infer<typeof expenseSchema>>({
    mutationFn: async (values) => {
      if (isEditMode) {
        return await updateExpense(id!, values)
      }
      return await createExpense(values)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses"] })
      form.reset()
      if (onClose) onClose()
    },
  })

  // 3. Define flattened default values object for a SINGLE expense
  const dv: z.input<typeof expenseSchema> = {
    expense_type_id: expenseData?.expense_type_id ?? 0,
    amount: expenseData?.amount ?? 0,
    date_from: expenseData?.date_from ?? "",
    date_to: expenseData?.date_to ?? "",
    notes: expenseData?.notes ?? "",
    attachments:
      expenseData?.expense_attachments?.map((a: ExpenseAttachmentRecord) => ({
        id: a.id,
        url_link: a.url_link,
        file: undefined, // Keeps shape identical for TypeScript
      })) ?? [],
  }

  // 4. Pass `dv` into TanStack `useForm`
  const form = useForm({
    defaultValues: dv,
    validators: {
      onSubmit: expenseSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({
        ...value,
        attachments: value.attachments ?? [],
      })
    },
  })

  if (isEditMode && isExpenseLoading) {
    return (
      <div className="animate-pulse p-4 text-sm text-muted-foreground">
        Loading expense details...
      </div>
    )
  }

  return (
    <form
      className="max-h-[80vh] space-y-6 overflow-y-auto px-1"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      <div className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
        <h3 className="text-sm font-semibold">Expense Details</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* EXPENSE TYPE (Combobox) */}
          <form.Field name="expense_type_id">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel>
                    Expense Type <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Popover open={isTypeOpen} onOpenChange={setIsTypeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isTypeOpen}
                        className="w-full justify-between"
                        disabled={mutation.isPending}
                      >
                        {field.state.value
                          ? expenseTypes.find((t) => t.id === field.state.value)
                              ?.type_name
                          : "Select Type..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[250px] p-0">
                      <Command>
                        <CommandInput placeholder="Search type..." />
                        <CommandList>
                          <CommandEmpty>No expense type found.</CommandEmpty>
                          <CommandGroup>
                            {expenseTypes.map((type) => (
                              <CommandItem
                                key={type.id}
                                value={type.type_name}
                                onSelect={() => {
                                  field.handleChange(type.id)
                                  setIsTypeOpen(false) // UX Fix: Close popover on select
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    field.state.value === type.id
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {type.type_name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          {/* AMOUNT */}
          <form.Field name="amount">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Amount <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Input
                    id={field.name}
                    type="number"
                    step="0.01"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(e.target.valueAsNumber || 0)
                    }
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          {/* DATE FROM */}
          <form.Field name="date_from">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Date From <span className="text-red-500">*</span>
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

          {/* DATE TO */}
          <form.Field name="date_to">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Date To <span className="text-red-500">*</span>
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
        </div>

        {/* NOTES */}
        <form.Field name="notes">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Notes</FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Additional details..."
                disabled={mutation.isPending}
              />
            </Field>
          )}
        </form.Field>

        {/* ATTACHMENTS */}
        <form.Field name="attachments">
          {(field) => {
            const attachments = field.state.value ?? []

            return (
              <Field>
                <FieldLabel
                  htmlFor={field.name}
                  className="flex items-center gap-1"
                >
                  <Paperclip className="h-3.5 w-3.5" /> Attachments
                </FieldLabel>

                <Input
                  id={field.name}
                  type="file"
                  multiple
                  disabled={mutation.isPending}
                  onChange={(e) => {
                    const files = Array.from(e.target.files ?? [])
                    const fileObjs: ExpenseAttachmentValues[] = files.map(
                      (file) => ({
                        id: undefined,
                        url_link: undefined,
                        file,
                      })
                    )
                    field.handleChange([...attachments, ...fileObjs])
                  }}
                />

                {attachments.length > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground">
                    {attachments.length} attachment(s) selected
                  </div>
                )}
              </Field>
            )
          }}
        </form.Field>
      </div>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Saving Expense..."
          : isEditMode
            ? "Update Expense"
            : "Save Expense"}
      </Button>
    </form>
  )
}
