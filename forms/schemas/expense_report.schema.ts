import * as z from "zod"

export const expenseItemSchema = z.object({
  id: z.string().optional(),
  expense_type_id: z.coerce
    .number({ invalid_type_error: "Expense type is required" })
    .min(1, "Expense type is required"),
  amount: z.coerce
    .number({ invalid_type_error: "Amount is required" })
    .gt(0, "Amount must be greater than 0"),
  date_from: z.string().min(1, "Start date is required"),
  date_to: z.string().optional(),
  reason: z.string().optional(),
})

export const expenseReportSchema = z.object({
  id: z.string().optional(),
  report_title: z.string().min(1, "Report title is required").max(150),
  report_description: z.string().optional(),
  expense_report_type_id: z.coerce
    .number({ invalid_type_error: "Report type is required" })
    .min(1, "Report type is required"),
  date_from: z.string().min(1, "Report start date is required"),
  date_to: z.string().min(1, "Report end date is required"),
  expenses: z
    .array(expenseItemSchema)
    .min(1, "At least one expense item is required to submit a report"),
})

export type ExpenseReportFormValues = z.infer<typeof expenseReportSchema>
export type ExpenseItemFormValues = z.infer<typeof expenseItemSchema>
