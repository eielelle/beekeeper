import { toast } from "sonner"
import * as z from "zod"
import { expenseSchema } from "../schemas/expense.schema"
import {
  fetchExpenseTypesOptionsAction,
  getExpenseAction,
  createExpenseAction,
  updateExpenseAction,
} from "@/actions/expense.action"

export type ExpenseAttachmentRecord = {
  id: string
  url_link: string
}

export type ExpenseRecord = {
  id: string
  expense_type_id: number
  amount: number
  date_from: string
  date_to: string
  notes?: string
  expense_attachments?: ExpenseAttachmentRecord[]
}

// 1. Options
export async function fetchExpenseTypesOptions() {
  try {
    return await fetchExpenseTypesOptionsAction()
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    return []
  }
}

// 2. Get Single
export async function getExpense(id: string) {
  try {
    return await getExpenseAction(id)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// 3. Create
export async function createExpense(values: z.infer<typeof expenseSchema>) {
  const t = toast.loading("Saving expense...")
  try {
    const data = await createExpenseAction(values)
    toast.dismiss(t)
    toast.success("Expense saved successfully.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`Error: ${error.message}`)
    throw error
  }
}

// 4. Update
export async function updateExpense(
  id: string,
  values: z.infer<typeof expenseSchema>
) {
  const t = toast.loading("Updating expense...")
  try {
    const success = await updateExpenseAction(id, values)
    toast.dismiss(t)
    toast.success("Expense updated successfully.")
    return success
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`Error: ${error.message}`)
    throw error
  }
}
