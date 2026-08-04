import * as z from "zod"

export const expenseAttachmentSchema = z.object({
  id: z.string().uuid().optional(),
  url_link: z.string().optional(),
  file: z.instanceof(File).optional(),
})

export type ExpenseAttachmentValues = z.infer<typeof expenseAttachmentSchema>

export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  expense_type_id: z.coerce.number().min(1, "Expense type is required"),
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0"),
  date_from: z.string().min(1, "Start date is required"),
  date_to: z.string().min(1, "End date is required"),
  notes: z.string().optional(),
  attachments: z.array(expenseAttachmentSchema).optional(),
})

export type ExpenseValues = z.infer<typeof expenseSchema>
