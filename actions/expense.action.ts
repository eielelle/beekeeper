"use server"

import { createClient } from "@/lib/supabase/server"
import { fetchUserPermissions } from "@/lib/casl/server"

export async function fetchExpenseTypesOptionsAction() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expense_types")
    .select("id, type_name")

  if (error) throw new Error(error.message)
  return data || []
}

export async function getExpenseAction(id: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("expenses")
    .select(
      `
      *,
      expense_attachments ( id, url_link )
    `
    )
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createExpenseAction(values: any) {
  // 1. Securely fetch the employee ID
  const { employeeId } = await fetchUserPermissions()
  if (!employeeId) throw new Error("Employee profile not found.")

  const supabase = await createClient()

  // 2. Create a hidden wrapper "Report" to link the employee
  const { data: report, error: reportError } = await supabase
    .from("expense_reports")
    .insert([
      {
        employee_id: employeeId,
        report_title: `Expense - ${new Date().toLocaleDateString()}`,
        report_description: values.notes || "Standalone expense entry",
        date_from: values.date_from,
        date_to: values.date_to,
      },
    ])
    .select("id")
    .single()

  if (reportError) throw new Error(reportError.message)

  // 3. Create the actual Expense Line Item
  const { data: expense, error: expenseError } = await supabase
    .from("expenses")
    .insert([
      {
        expense_report_id: report.id,
        expense_type_id: values.expense_type_id,
        amount: values.amount,
        date_from: values.date_from,
        date_to: values.date_to,
        notes: values.notes,
      },
    ])
    .select("id")
    .single()

  if (expenseError) throw new Error(expenseError.message)

  // 4. Upload Files to Supabase Storage
  if (values.attachments && values.attachments.length > 0) {
    for (const attachment of values.attachments) {
      if (attachment.file) {
        const fileName = `${report.id}/${expense.id}/${Date.now()}_${attachment.file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(fileName, attachment.file)

        if (!uploadError && uploadData) {
          const { data: publicUrl } = supabase.storage
            .from("expense-receipts")
            .getPublicUrl(uploadData.path)

          await supabase.from("expense_attachments").insert([
            {
              expense_id: expense.id,
              url_link: publicUrl.publicUrl,
            },
          ])
        }
      }
    }
  }

  return expense
}

export async function updateExpenseAction(id: string, values: any) {
  const supabase = await createClient()

  // 1. Update the Expense Item
  const { error: expenseError } = await supabase
    .from("expenses")
    .update({
      expense_type_id: values.expense_type_id,
      amount: values.amount,
      date_from: values.date_from,
      date_to: values.date_to,
      notes: values.notes,
    })
    .eq("id", id)

  if (expenseError) throw new Error(expenseError.message)

  // 2. Upload any newly added attachments
  if (values.attachments && values.attachments.length > 0) {
    for (const attachment of values.attachments) {
      if (attachment.file && !attachment.id) {
        const fileName = `updates/${id}/${Date.now()}_${attachment.file.name}`
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from("expense-receipts")
          .upload(fileName, attachment.file)

        if (!uploadError && uploadData) {
          const { data: publicUrl } = supabase.storage
            .from("expense-receipts")
            .getPublicUrl(uploadData.path)

          await supabase.from("expense_attachments").insert([
            {
              expense_id: id,
              url_link: publicUrl.publicUrl,
            },
          ])
        }
      }
    }
  }

  return true
}
