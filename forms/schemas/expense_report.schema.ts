import * as z from "zod"

export const expenseReportSchema = z.object({
  report_title: z.string().min(1, "Report title is required").max(150),
  report_description: z.string().optional(),
  date_from: z.string().min(1, "Start date is required"),
  date_to: z.string().min(1, "End date is required"),
  expense_ids: z
    .array(z.string())
    .min(1, "Please select at least one expense to include in this report"),
})

export type ExpenseReportValues = z.infer<typeof expenseReportSchema>
