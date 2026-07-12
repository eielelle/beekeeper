"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Check, ChevronsUpDown, Plus, Trash2, Paperclip } from "lucide-react"

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
  createExpenseReport,
  getExpenseReport,
  updateExpenseReport,
  fetchExpenseTypesOptions,
  ExpenseRecord,
  ExpenseAttachmentRecord,
} from "./queries/expense_report.query"
import {
  ExpenseAttachmentValues,
  expenseReportSchema,
} from "./schemas/expense_report.schema"

export function ExpenseReportForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const params = useParams()
  let id = editId
  if (!id && params?.id) {
    id = Array.isArray(params.id) ? params.id[0] : params.id
  }
  const isEditMode = !!id

  // 1. Queries
  const { data: reportData, isLoading: isReportLoading } = useQuery({
    queryKey: ["expense_reports", id],
    queryFn: () => getExpenseReport(id!),
    enabled: isEditMode,
  })

  const { data: expenseTypes = [] } = useQuery({
    queryKey: ["expense_types_options"],
    queryFn: fetchExpenseTypesOptions,
  })

  // 2. Mutations
  const mutation = useMutation({
    mutationFn: (values: z.infer<typeof expenseReportSchema>) => {
      if (isEditMode) {
        return updateExpenseReport(id!, values)
      }
      return createExpenseReport(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
    },
  })
  // 1. Define your typed default values object using Zod's input type inference
  const dv: z.input<typeof expenseReportSchema> = {
    report_title: reportData?.report_title ?? "",
    report_description: reportData?.report_description ?? "",
    date_from: reportData?.date_from ?? "",
    date_to: reportData?.date_to ?? "",
    entries: reportData?.expenses?.map((e: ExpenseRecord) => ({
      id: e.id,
      expense_type_id: e.expense_type_id,
      date_from: e.date_from,
      date_to: e.date_to,
      amount: e.amount,
      notes: e.notes ?? "",
      attachments:
        e.expense_attachments?.map((a: ExpenseAttachmentRecord) => ({
          id: a.id,
          url_link: a.url_link,
          file: undefined, // Keeps shape identical for TypeScript
        })) ?? [],
    })) ?? [
      {
        expense_type_id: "",
        date_from: "",
        date_to: "",
        amount: 0,
        notes: "",
        attachments: [],
      },
    ],
  }

  // 2. Pass `dv` into TanStack `useForm`
  const form = useForm({
    defaultValues: dv,
    validators: {
      onSubmit: expenseReportSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate({
        ...value,
        entries: value.entries.map((entry) => ({
          ...entry,
          attachments: entry.attachments ?? [],
        })),
      })
    },
  })

  if (isEditMode && isReportLoading) {
    return (
      <div className="animate-pulse p-4 text-sm text-muted-foreground">
        Loading report details...
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
      <pre className="text-xs">
        {JSON.stringify(form.state.errorMap, null, 2)}
      </pre>
      {/* --- REPORT HEADER DETAILS --- */}
      <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">Report Information</h3>
        <form.Field name="report_title">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Report Title <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="e.g., Client Visit - Q3 Manila"
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="date_from">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Date From *</FieldLabel>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={mutation.isPending}
                />
              </Field>
            )}
          </form.Field>

          <form.Field name="date_to">
            {(field) => (
              <Field>
                <FieldLabel htmlFor={field.name}>Date To *</FieldLabel>
                <Input
                  id={field.name}
                  type="date"
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={mutation.isPending}
                />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="report_description">
          {(field) => (
            <Field>
              <FieldLabel htmlFor={field.name}>Description</FieldLabel>
              <Textarea
                id={field.name}
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Business purpose or general notes..."
                disabled={mutation.isPending}
              />
            </Field>
          )}
        </form.Field>
      </div>

      {/* --- EXPENSE ENTRIES (DYNAMIC ARRAY) --- */}
      <form.Field name="entries" mode="array">
        {(field) => (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Expense Items</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  field.pushValue({
                    expense_type_id: "",
                    date_from: "",
                    date_to: "",
                    amount: 0,
                    notes: "",
                    attachments: [],
                  })
                }
              >
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </div>

            {field.state.value.map((_, index) => (
              <div
                key={index}
                className="relative space-y-4 rounded-lg border bg-background p-4 shadow-sm"
              >
                <div className="flex items-center justify-between border-b pb-2">
                  <span className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                    Item #{index + 1}
                  </span>
                  {field.state.value.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => field.removeValue(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Combobox Searchable Expense Type */}
                  <form.Field
                    name={`entries[${index}].expense_type_id` as const}
                  >
                    {(subField) => (
                      <Field>
                        <FieldLabel>Expense Type *</FieldLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              className="w-full justify-between"
                            >
                              {subField.state.value
                                ? expenseTypes.find(
                                    (t) => t.id === subField.state.value
                                  )?.type_name
                                : "Select Type..."}
                              <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[250px] p-0">
                            <Command>
                              <CommandInput placeholder="Search type..." />
                              <CommandList>
                                <CommandEmpty>
                                  No expense type found.
                                </CommandEmpty>
                                <CommandGroup>
                                  {expenseTypes.map((type) => (
                                    <CommandItem
                                      key={type.id}
                                      value={type.type_name}
                                      onSelect={() => {
                                        subField.handleChange(type.id)
                                      }}
                                    >
                                      <Check
                                        className={cn(
                                          "mr-2 h-4 w-4",
                                          subField.state.value === type.id
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
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name={`entries[${index}].amount` as const}>
                    {(subField) => (
                      <Field>
                        <FieldLabel htmlFor={subField.name}>
                          Amount *
                        </FieldLabel>
                        <Input
                          id={subField.name}
                          type="number"
                          step="0.01"
                          value={subField.state.value}
                          onChange={(e) =>
                            subField.handleChange(e.target.valueAsNumber || 0)
                          }
                          disabled={mutation.isPending}
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <form.Field name={`entries[${index}].date_from` as const}>
                    {(subField) => (
                      <Field>
                        <FieldLabel htmlFor={subField.name}>
                          Date From *
                        </FieldLabel>
                        <Input
                          id={subField.name}
                          type="date"
                          value={subField.state.value}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>

                  <form.Field name={`entries[${index}].date_to` as const}>
                    {(subField) => (
                      <Field>
                        <FieldLabel htmlFor={subField.name}>
                          Date To *
                        </FieldLabel>
                        <Input
                          id={subField.name}
                          type="date"
                          value={subField.state.value}
                          onChange={(e) =>
                            subField.handleChange(e.target.value)
                          }
                        />
                      </Field>
                    )}
                  </form.Field>
                </div>

                <form.Field name={`entries[${index}].notes` as const}>
                  {(subField) => (
                    <Field>
                      <FieldLabel htmlFor={subField.name}>Notes</FieldLabel>
                      <Input
                        id={subField.name}
                        value={subField.state.value}
                        onChange={(e) => subField.handleChange(e.target.value)}
                        placeholder="Additional details..."
                      />
                    </Field>
                  )}
                </form.Field>

                <form.Field name={`entries[${index}].attachments` as const}>
                  {(subField) => {
                    const attachments = subField.state.value ?? []

                    return (
                      <Field>
                        <FieldLabel
                          htmlFor={subField.name}
                          className="flex items-center gap-1"
                        >
                          <Paperclip className="h-3.5 w-3.5" /> Attachments
                        </FieldLabel>

                        <Input
                          id={subField.name}
                          type="file"
                          multiple
                          onChange={(e) => {
                            const files = Array.from(e.target.files ?? [])

                            const fileObjs: ExpenseAttachmentValues[] =
                              files.map((file) => ({
                                id: undefined,
                                url_link: undefined,
                                file,
                              }))

                            subField.handleChange([...attachments, ...fileObjs])
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
            ))}
          </div>
        )}
      </form.Field>

      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending
          ? "Submitting Report..."
          : isEditMode
            ? "Update Expense Report"
            : "Submit Expense Report"}
      </Button>
    </form>
  )
}
