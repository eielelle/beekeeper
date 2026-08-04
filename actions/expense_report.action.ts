"use server"

import { createClient } from "@/lib/supabase/server"

// 1. Fetch expenses available to be attached to a report
export async function fetchAvailableExpensesAction(
  dateFrom: string,
  dateTo: string,
  currentReportId?: string
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()
  if (!emp) throw new Error("Employee not found")

  let query = supabase
    .from("expenses")
    .select(
      `
      *,
      expense_types(type_name),
      expense_reports!inner(employee_id, status)
    `
    )
    .eq("expense_reports.employee_id", emp.id)
    .gte("date_from", dateFrom)
    .lte("date_to", dateTo)

  // Only fetch expenses that are still pending.
  // If editing, also include expenses already attached to THIS report.
  if (currentReportId) {
    query = query.or(
      `status.eq.pending,expense_report_id.eq.${currentReportId}`,
      { foreignTable: "expense_reports" }
    )
  } else {
    query = query.eq("expense_reports.status", "pending")
  }

  const { data, error } = await query.order("date_from", { ascending: false })
  if (error) throw new Error(error.message)

  return data || []
}

export async function getExpenseReportAction(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expense_reports")
    .select(`*, expenses(id)`)
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createExpenseReportAction(values: any) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const { data: emp } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user?.id)
    .single()

  // 1. Create the formal Report
  const { data: report, error: reportError } = await supabase
    .from("expense_reports")
    .insert([
      {
        employee_id: emp?.id,
        report_title: values.report_title,
        report_description: values.report_description,
        date_from: values.date_from,
        date_to: values.date_to,
      },
    ])
    .select("id")
    .single()

  if (reportError) throw new Error(reportError.message)

  // 2. Reassign the selected expenses to this new report
  if (values.expense_ids.length > 0) {
    const { error: updateError } = await supabase
      .from("expenses")
      .update({ expense_report_id: report.id })
      .in("id", values.expense_ids)

    if (updateError) throw new Error(updateError.message)
  }

  return report
}

export async function updateExpenseReportAction(id: string, values: any) {
  const supabase = await createClient()

  // 1. Update Header
  const { error: reportError } = await supabase
    .from("expense_reports")
    .update({
      report_title: values.report_title,
      report_description: values.report_description,
      date_from: values.date_from,
      date_to: values.date_to,
    })
    .eq("id", id)

  if (reportError) throw new Error(reportError.message)

  // 2. Reassign newly selected expenses to this report
  if (values.expense_ids.length > 0) {
    await supabase
      .from("expenses")
      .update({ expense_report_id: id })
      .in("id", values.expense_ids)
  }

  return true
}
