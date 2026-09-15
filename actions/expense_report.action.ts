"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { ExpenseReportFormValues } from "@/forms/schemas/expense_report.schema"

// ==========================================
// 1. CREATE EXPENSE REPORT WITH ITEMS
// ==========================================
export async function createExpenseReportAction(
  values: ExpenseReportFormValues
) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "expense_reports")) {
    throw new Error(
      "Forbidden: You do not have permission to create expense reports."
    )
  }

  const { employeeId } = await fetchUserPermissions()
  if (!employeeId) {
    throw new Error("Employee profile not found.")
  }

  const supabase = await createClient()

  // 1. Insert parent Expense Report
  const { data: report, error: reportError } = await supabase
    .from("expense_reports")
    .insert([
      {
        employee_id: employeeId,
        report_title: values.report_title,
        report_description: values.report_description,
        expense_report_type_id: values.expense_report_type_id,
        date_from: values.date_from,
        date_to: values.date_to,
        status: "pending",
      },
    ])
    .select()
    .single()

  if (reportError) throw new Error(reportError.message)

  // 2. Insert linked Expense Items
  const expenseItemsPayload = values.expenses.map((item) => ({
    expense_report_id: report.id,
    expense_type_id: item.expense_type_id,
    amount: item.amount,
    date_from: item.date_from,
    date_to: item.date_to || item.date_from,
    reason: item.reason,
  }))

  const { error: itemsError } = await supabase
    .from("expenses")
    .insert(expenseItemsPayload)

  if (itemsError) {
    // Rollback parent report if items fail
    await supabase.from("expense_reports").delete().eq("id", report.id)
    throw new Error(`Failed to save expense items: ${itemsError.message}`)
  }

  return report
}

// ==========================================
// 2. UPDATE EXPENSE REPORT WITH ITEMS
// ==========================================
export async function updateExpenseReportAction(
  id: string,
  values: ExpenseReportFormValues
) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "expense_reports")) {
    throw new Error(
      "Forbidden: You do not have permission to update expense reports."
    )
  }

  const supabase = await createClient()

  // 1. Update parent report
  const { data: report, error: reportError } = await supabase
    .from("expense_reports")
    .update({
      report_title: values.report_title,
      report_description: values.report_description,
      expense_report_type_id: values.expense_report_type_id,
      date_from: values.date_from,
      date_to: values.date_to,
    })
    .eq("id", id)
    .select()
    .single()

  if (reportError) throw new Error(reportError.message)

  // 2. Sync items: Delete existing items and re-insert updated list
  const { error: deleteError } = await supabase
    .from("expenses")
    .delete()
    .eq("expense_report_id", id)

  if (deleteError)
    throw new Error(`Failed to update items: ${deleteError.message}`)

  const expenseItemsPayload = values.expenses.map((item) => ({
    expense_report_id: id,
    expense_type_id: item.expense_type_id,
    amount: item.amount,
    date_from: item.date_from,
    date_to: item.date_to || item.date_from,
    reason: item.reason,
  }))

  const { error: itemsError } = await supabase
    .from("expenses")
    .insert(expenseItemsPayload)

  if (itemsError) throw new Error(itemsError.message)

  return report
}

// ==========================================
// 3. GET SINGLE EXPENSE REPORT
// ==========================================
export async function getExpenseReportAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "expense_reports")) {
    throw new Error("Forbidden: You cannot view this expense report.")
  }

  const supabase = await createClient()

  const { data, error } = await supabase
    .from("expense_reports")
    .select("*, expenses(*)")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. DROPDOWN OPTIONS HELPERS
// ==========================================
export async function fetchExpenseReportTypeOptionsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "expense_reports")) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expense_report_type")
    .select("id, name")
    .order("name")

  if (error) return []
  return data.map((item) => ({ value: String(item.id), label: item.name }))
}

export async function fetchExpenseTypeOptionsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "expense_reports")) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expense_types")
    .select("id, type_name")
    .order("type_name")

  if (error) return []
  return data.map((item) => ({ value: String(item.id), label: item.type_name }))
}
