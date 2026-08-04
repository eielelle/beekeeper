"use client"

import * as React from "react"
import { useForm, useStore } from "@tanstack/react-form"
import * as z from "zod"
import { useParams } from "next/navigation"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Loader2, Receipt } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"

import {
  createExpenseReport,
  getExpenseReport,
  updateExpenseReport,
  fetchAvailableExpenses,
} from "./queries/expense_report.query"
import { expenseReportSchema } from "./schemas/expense_report.schema"

export function ExpenseReportForm({
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

  // 1. Fetch existing report if editing
  const { data: reportData, isLoading: isReportLoading } = useQuery({
    queryKey: ["expense_reports", id],
    queryFn: () => getExpenseReport(id!),
    enabled: isEditMode,
  })

  // 2. Setup Form
  const form = useForm({
    defaultValues: {
      report_title: reportData?.report_title ?? "",
      report_description: reportData?.report_description ?? "",
      date_from: reportData?.date_from ?? "",
      date_to: reportData?.date_to ?? "",
      expense_ids: reportData?.expenses?.map((e: any) => e.id) ?? [],
    } as z.input<typeof expenseReportSchema>,
    validators: { onSubmit: expenseReportSchema },
    onSubmit: async ({ value }) => {
      mutation.mutate(value)
    },
  })

  // 3. Watch dates to fetch available expenses dynamically
  const dateFrom = useStore(form.store, (state) => state.values.date_from)
  const dateTo = useStore(form.store, (state) => state.values.date_to)

  const { data: availableExpenses = [], isLoading: isExpensesLoading } =
    useQuery({
      queryKey: ["available-expenses", dateFrom, dateTo, id],
      queryFn: () => fetchAvailableExpenses(dateFrom, dateTo, id),
      enabled: !!dateFrom && !!dateTo,
    })

  // 4. Mutation
  const mutation = useMutation<any, Error, z.infer<typeof expenseReportSchema>>(
    {
      mutationFn: async (values) => {
        if (isEditMode) return await updateExpenseReport(id!, values)
        return await createExpenseReport(values)
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["my-expense-reports"] })
        form.reset()
        if (onClose) onClose()
      },
    }
  )

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
      <div className="space-y-4 rounded-lg border bg-muted/20 p-4">
        <h3 className="text-sm font-semibold">Report Information</h3>
        <form.Field name="report_title">
          {(field) => (
            <Field
              data-invalid={
                field.state.meta.isTouched && !field.state.meta.isValid
              }
            >
              <FieldLabel>
                Report Title <span className="text-red-500">*</span>
              </FieldLabel>
              <Input
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g., Client Visit - Q3 Manila"
                disabled={mutation.isPending}
              />
              <FieldError errors={field.state.meta.errors} />
            </Field>
          )}
        </form.Field>

        <div className="grid grid-cols-2 gap-4">
          <form.Field name="date_from">
            {(field) => (
              <Field
                data-invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
              >
                <FieldLabel>
                  Date From <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={mutation.isPending}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
          <form.Field name="date_to">
            {(field) => (
              <Field
                data-invalid={
                  field.state.meta.isTouched && !field.state.meta.isValid
                }
              >
                <FieldLabel>
                  Date To <span className="text-red-500">*</span>
                </FieldLabel>
                <Input
                  type="date"
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  disabled={mutation.isPending}
                />
                <FieldError errors={field.state.meta.errors} />
              </Field>
            )}
          </form.Field>
        </div>

        <form.Field name="report_description">
          {(field) => (
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Business purpose or general notes..."
                disabled={mutation.isPending}
              />
            </Field>
          )}
        </form.Field>
      </div>

      {/* EXPENSE SELECTION (Shows only if dates are valid) */}
      <div className="space-y-4 rounded-lg border bg-background p-4 shadow-sm">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          <Receipt className="h-4 w-4" />
          Select Expenses to Include
        </h3>

        {!dateFrom || !dateTo ? (
          <p className="rounded-md bg-muted/50 py-4 text-center text-sm text-muted-foreground">
            Please enter a Date Range above to see available expenses.
          </p>
        ) : isExpensesLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : availableExpenses.length === 0 ? (
          <p className="rounded-md bg-muted/50 py-4 text-center text-sm text-muted-foreground">
            No pending expenses found for this date range.
          </p>
        ) : (
          <form.Field name="expense_ids" mode="array">
            {(field) => (
              <div className="space-y-2">
                {availableExpenses.map((exp: any) => {
                  const isSelected = field.state.value.includes(exp.id)
                  return (
                    <label
                      key={exp.id}
                      className="flex cursor-pointer items-start gap-3 rounded-md border p-3 transition-colors hover:bg-muted/50"
                    >
                      <Checkbox
                        className="mt-1"
                        checked={isSelected}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            field.pushValue(exp.id)
                          } else {
                            const index = field.state.value.indexOf(exp.id)
                            if (index > -1) field.removeValue(index)
                          }
                        }}
                      />
                      <div className="flex flex-1 flex-col gap-1 leading-none">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {exp.expense_types?.type_name || "Expense"}
                          </span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {new Intl.NumberFormat("en-PH", {
                              style: "currency",
                              currency: "PHP",
                            }).format(exp.amount)}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(exp.date_from).toLocaleDateString()}
                        </span>
                        {exp.notes && (
                          <span className="line-clamp-1 text-xs text-muted-foreground">
                            {exp.notes}
                          </span>
                        )}
                      </div>
                    </label>
                  )
                })}
                {field.state.meta.errors &&
                  field.state.meta.errors.length > 0 && (
                    <p className="mt-2 text-sm font-medium text-destructive">
                      {field.state.meta.errors.join(", ")}
                    </p>
                  )}
              </div>
            )}
          </form.Field>
        )}
      </div>

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
