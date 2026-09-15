"use client"

import * as React from "react"
import { useForm } from "@tanstack/react-form"
import { useRouter, useParams } from "next/navigation"
import { useMutation, useQuery } from "@tanstack/react-query"
import { Loader2, Plus, Trash2, Receipt, Calendar } from "lucide-react"

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

import {
  createExpenseReport,
  getExpenseReport,
  updateExpenseReport,
  fetchExpenseReportTypeOptions,
  fetchExpenseTypeOptions,
} from "./queries/expense_report.query"
import {
  expenseReportSchema,
  ExpenseReportFormValues,
} from "./schemas/expense_report.schema"

export function ExpenseReportForm({
  editId,
  onClose,
}: {
  editId?: string
  onClose?: () => void
}) {
  const router = useRouter()
  const params = useParams()
  const id = editId || (params?.id as string | undefined)
  const isEditMode = !!id

  // 1. Fetch Report Data in Edit Mode
  const { data: reportData, isLoading: isLoadingReport } = useQuery({
    queryKey: ["expense-report", id],
    queryFn: () => getExpenseReport(id!),
    enabled: isEditMode,
  })

  // 2. Fetch Dropdown Options
  const { data: reportTypeOptions = [] } = useQuery({
    queryKey: ["expense-report-types"],
    queryFn: fetchExpenseReportTypeOptions,
  })

  const { data: expenseTypeOptions = [] } = useQuery({
    queryKey: ["expense-types"],
    queryFn: fetchExpenseTypeOptions,
  })

  // 3. Mutation Setup
  const mutation = useMutation({
    mutationFn: (values: ExpenseReportFormValues) => {
      if (isEditMode) {
        return updateExpenseReport(id!, values)
      }
      return createExpenseReport(values)
    },
    onSuccess: () => {
      form.reset()
      if (onClose) onClose()
      router.push("/d/expenses/view-reports")
    },
  })

  // 4. Form Initial State
  const defaultValues: ExpenseReportFormValues = {
    report_title: reportData?.report_title ?? "",
    report_description: reportData?.report_description ?? "",
    expense_report_type_id:
      reportData?.expense_report_type_id ?? (undefined as any),
    date_from: reportData?.date_from ?? new Date().toISOString().split("T")[0],
    date_to: reportData?.date_to ?? new Date().toISOString().split("T")[0],
    expenses: reportData?.expenses?.length
      ? reportData.expenses.map((exp: any) => ({
          id: exp.id,
          expense_type_id: exp.expense_type_id,
          amount: Number(exp.amount),
          date_from: exp.date_from,
          date_to: exp.date_to ?? exp.date_from,
          reason: exp.reason ?? "",
        }))
      : [
          {
            expense_type_id: undefined as any,
            amount: 0,
            date_from: new Date().toISOString().split("T")[0],
            date_to: "",
            reason: "",
          },
        ],
  }

  const form = useForm({
    defaultValues,
    validators: {
      onSubmit: expenseReportSchema,
    },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  if (isEditMode && isLoadingReport) {
    return (
      <div className="flex items-center space-x-2 p-6 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span>Loading report details...</span>
      </div>
    )
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault()
        e.stopPropagation()
        form.handleSubmit()
      }}
    >
      {/* HEADER SECTION: REPORT METADATA */}
      <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 border-b pb-3 font-semibold text-card-foreground">
          <Receipt className="h-4 w-4 text-primary" />
          <span>General Information</span>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {/* REPORT TITLE */}
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
                    placeholder="e.g., Client Visit - Q3 Sales"
                    disabled={mutation.isPending}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              )
            }}
          </form.Field>

          {/* REPORT TYPE */}
          <form.Field name="expense_report_type_id">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name}>
                    Report Type <span className="text-red-500">*</span>
                  </FieldLabel>
                  <Select
                    value={field.state.value ? String(field.state.value) : ""}
                    onValueChange={(val) => field.handleChange(Number(val))}
                    disabled={mutation.isPending}
                  >
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypeOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
                    Start Date <span className="text-red-500">*</span>
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
                    End Date <span className="text-red-500">*</span>
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

        {/* DESCRIPTION */}
        <form.Field name="report_description">
          {(field) => {
            const isInvalid =
              field.state.meta.isTouched && !field.state.meta.isValid
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>
                  Description / Purpose
                </FieldLabel>
                <Textarea
                  id={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Provide brief context for this expense request..."
                  disabled={mutation.isPending}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            )
          }}
        </form.Field>
      </div>

      {/* LINE ITEMS SECTION: EXPENSES ARRAY */}
      <div className="space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2 font-semibold text-card-foreground">
            <Calendar className="h-4 w-4 text-primary" />
            <span>Expense Items</span>
          </div>

          {/* TOTAL SUMMARY BADGE */}
          <form.Subscribe selector={(s) => s.values.expenses}>
            {(expenses) => {
              const total = (expenses || []).reduce(
                (sum, item) => sum + (Number(item?.amount) || 0),
                0
              )
              return (
                <div className="text-sm font-medium">
                  Total:{" "}
                  <span className="font-bold text-primary">
                    ₱
                    {total.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </span>
                </div>
              )
            }}
          </form.Subscribe>
        </div>

        <form.Field name="expenses" mode="array">
          {(field) => (
            <div className="space-y-4">
              {field.state.value?.map((_, index) => (
                <div
                  key={index}
                  className="relative space-y-3 rounded-md border bg-muted/10 p-3"
                >
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                      Item #{index + 1}
                    </span>
                    {field.state.value.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10"
                        onClick={() => field.removeValue(index)}
                        disabled={mutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                    {/* EXPENSE TYPE */}
                    <form.Field name={`expenses[${index}].expense_type_id`}>
                      {(subField) => {
                        const isInvalid =
                          subField.state.meta.isTouched &&
                          !subField.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={subField.name}>
                              Expense Category{" "}
                              <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Select
                              value={
                                subField.state.value
                                  ? String(subField.state.value)
                                  : ""
                              }
                              onValueChange={(val) =>
                                subField.handleChange(Number(val))
                              }
                              disabled={mutation.isPending}
                            >
                              <SelectTrigger id={subField.name}>
                                <SelectValue placeholder="Select type" />
                              </SelectTrigger>
                              <SelectContent>
                                {expenseTypeOptions.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {isInvalid && (
                              <FieldError errors={subField.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    </form.Field>

                    {/* AMOUNT */}
                    <form.Field name={`expenses[${index}].amount`}>
                      {(subField) => {
                        const isInvalid =
                          subField.state.meta.isTouched &&
                          !subField.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={subField.name}>
                              Amount (₱) <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Input
                              id={subField.name}
                              type="number"
                              step="0.01"
                              value={subField.state.value}
                              onBlur={subField.handleBlur}
                              onChange={(e) =>
                                subField.handleChange(Number(e.target.value))
                              }
                              disabled={mutation.isPending}
                            />
                            {isInvalid && (
                              <FieldError errors={subField.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    </form.Field>

                    {/* ITEM DATE */}
                    <form.Field name={`expenses[${index}].date_from`}>
                      {(subField) => {
                        const isInvalid =
                          subField.state.meta.isTouched &&
                          !subField.state.meta.isValid
                        return (
                          <Field data-invalid={isInvalid}>
                            <FieldLabel htmlFor={subField.name}>
                              Date Incurred{" "}
                              <span className="text-red-500">*</span>
                            </FieldLabel>
                            <Input
                              id={subField.name}
                              type="date"
                              value={subField.state.value}
                              onBlur={subField.handleBlur}
                              onChange={(e) =>
                                subField.handleChange(e.target.value)
                              }
                              disabled={mutation.isPending}
                            />
                            {isInvalid && (
                              <FieldError errors={subField.state.meta.errors} />
                            )}
                          </Field>
                        )
                      }}
                    </form.Field>
                  </div>

                  {/* REASON / REMARKS */}
                  <form.Field name={`expenses[${index}].reason`}>
                    {(subField) => {
                      const isInvalid =
                        subField.state.meta.isTouched &&
                        !subField.state.meta.isValid
                      return (
                        <Field data-invalid={isInvalid}>
                          <FieldLabel htmlFor={subField.name}>
                            Reason / Remarks
                          </FieldLabel>
                          <Input
                            id={subField.name}
                            value={subField.state.value}
                            onBlur={subField.handleBlur}
                            onChange={(e) =>
                              subField.handleChange(e.target.value)
                            }
                            placeholder="e.g., Taxi receipt #1042"
                            disabled={mutation.isPending}
                          />
                          {isInvalid && (
                            <FieldError errors={subField.state.meta.errors} />
                          )}
                        </Field>
                      )
                    }}
                  </form.Field>
                </div>
              ))}

              {/* ADD ITEM BUTTON */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={() =>
                  field.pushValue({
                    expense_type_id: undefined as any,
                    amount: 0,
                    date_from: new Date().toISOString().split("T")[0],
                    date_to: "",
                    reason: "",
                  })
                }
                disabled={mutation.isPending}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Another Expense Line Item
              </Button>
            </div>
          )}
        </form.Field>
      </div>

      {/* FORM ACTIONS */}
      <div className="flex justify-end gap-3 pt-2">
        {onClose && (
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={mutation.isPending}>
          {mutation.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          {isEditMode ? "Update Report" : "Submit Report"}
        </Button>
      </div>
    </form>
  )
}
