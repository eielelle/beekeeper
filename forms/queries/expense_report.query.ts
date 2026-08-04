import { toast } from "sonner"
import * as z from "zod"
import { expenseReportSchema } from "../schemas/expense_report.schema"
import {
  getExpenseReportAction,
  createExpenseReportAction,
  updateExpenseReportAction,
  fetchAvailableExpensesAction,
} from "@/actions/expense_report.action"

export async function fetchAvailableExpenses(
  dateFrom: string,
  dateTo: string,
  currentReportId?: string
) {
  try {
    return await fetchAvailableExpensesAction(dateFrom, dateTo, currentReportId)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    return []
  }
}

export async function getExpenseReport(id: string) {
  try {
    return await getExpenseReportAction(id)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function createExpenseReport(
  values: z.infer<typeof expenseReportSchema>
) {
  const t = toast.loading("Submitting expense report...")
  try {
    const data = await createExpenseReportAction(values)
    toast.dismiss(t)
    toast.success("Expense report submitted successfully.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`Error: ${error.message}`)
    throw error
  }
}

export async function updateExpenseReport(
  id: string,
  values: z.infer<typeof expenseReportSchema>
) {
  const t = toast.loading("Updating report...")
  try {
    const success = await updateExpenseReportAction(id, values)
    toast.dismiss(t)
    toast.success("Updated successfully.")
    return success
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`Error: ${error.message}`)
    throw error
  }
}
