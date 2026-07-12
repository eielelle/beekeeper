import * as z from "zod"

// schemas/expense_report.schema.ts
export const expenseAttachmentSchema = z.object({
  id: z.coerce.number().optional(),
  url_link: z.string().optional(),
  file: z.custom<File>((val) => val instanceof File).optional(),
})

export const expenseEntrySchema = z.object({
  id: z.string().optional(),
  expense_type_id: z.coerce.number(),
  date_from: z.string().min(1, "Date from is required"),
  date_to: z.string().min(1, "Date to is required"),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  notes: z.string().optional(),
  attachments: z.array(expenseAttachmentSchema).default([]),
})

export const expenseReportSchema = z.object({
  report_title: z.string().min(1, "Title is required"),
  report_description: z.string().optional(),
  date_from: z.string().min(1, "Start date required"),
  date_to: z.string().min(1, "End date required"),
  entries: z.array(expenseEntrySchema).min(1, "At least one entry required"),
})
export type ExpenseReportFormValues = z.infer<typeof expenseReportSchema>
export type ExpenseEntryValues = z.infer<typeof expenseEntrySchema>
export type ExpenseAttachmentValues = z.infer<typeof expenseAttachmentSchema>
