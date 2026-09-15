import { toast } from "sonner"
import {
  createExpenseReportAction,
  updateExpenseReportAction,
  getExpenseReportAction,
  fetchExpenseReportTypeOptionsAction,
  fetchExpenseTypeOptionsAction,
} from "@/actions/expense_report.action"
import { ExpenseReportFormValues } from "@/forms/schemas/expense_report.schema"

export async function createExpenseReport(values: ExpenseReportFormValues) {
  const t = toast.loading("Submitting expense report...")
  try {
    const data = await createExpenseReportAction(values)
    toast.dismiss(t)
    toast.success("Expense report submitted successfully.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function updateExpenseReport(
  id: string,
  values: ExpenseReportFormValues
) {
  const t = toast.loading("Updating expense report...")
  try {
    const data = await updateExpenseReportAction(id, values)
    toast.dismiss(t)
    toast.success("Expense report updated successfully.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function getExpenseReport(id: string) {
  const t = toast.loading("Fetching expense report details...")
  try {
    const data = await getExpenseReportAction(id)
    toast.dismiss(t)
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function fetchExpenseReportTypeOptions() {
  return await fetchExpenseReportTypeOptionsAction()
}

export async function fetchExpenseTypeOptions() {
  return await fetchExpenseTypeOptionsAction()
}
