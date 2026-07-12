import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { ExpenseReportFormValues } from "@/forms/schemas/expense_report.schema"

export type ExpenseAttachmentRecord = {
  id?: number
  created_at?: string
  org_id?: number
  expense_id?: number
  url_link: string
}

export type ExpenseRecord = {
  id: string
  created_at?: string
  org_id?: number
  expense_report_id?: number
  expense_type_id: number
  date_from: string
  date_to: string
  notes?: string | null
  amount: number
  expense_attachments?: ExpenseAttachmentRecord[]
}

export type ExpenseReportStoreType = {
  id?: number
  created_at?: string
  org_id?: number
  report_title: string
  report_description?: string | null
  date_from: string
  date_to: string
  expenses?: Array<{
    amount: number
  }>
}

export type FetchExpenseReportsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchExpenseReports({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchExpenseReportsParams) {
  const t = toast.loading("Fetching Expense Reports. Please wait.")

  let query = supabase
    .from("expense_reports")
    .select("*, expenses(amount)", { count: "exact" })

  if (globalFilter) {
    query = query.ilike("report_title", `%${globalFilter}%`)
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return {
    data: (data as ExpenseReportStoreType[]) || [],
    rowCount: count || 0,
  }
}

export async function fetchExpenseTypesOptions() {
  const { data, error } = await supabase
    .from("expense_types")
    .select("id, type_name")
    .order("type_name", { ascending: true })

  if (error) throw error
  return (data as Array<{ id: string; type_name: string }>) || []
}

export async function getExpenseReport(id: string) {
  const t = toast.loading("Fetching Expense Report details...")

  const { data, error } = await supabase
    .from("expense_reports")
    .select(
      `
      *,
      expenses (
        *,
        expense_attachments (*)
      )
    `
    )
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data as ExpenseReportStoreType & { expenses: ExpenseRecord[] }
}

export async function createExpenseReport(values: ExpenseReportFormValues) {
  const t = toast.loading("Submitting Expense Report...")

  try {
    // 1. Create Main Expense Report Header
    const { data: report, error: reportErr } = await supabase
      .from("expense_reports")
      .insert([
        {
          report_title: values.report_title,
          report_description: values.report_description,
          date_from: values.date_from,
          date_to: values.date_to,
        },
      ])
      .select()
      .single()

    if (reportErr) throw reportErr

    // 2. Process Entries & Attachments
    for (const entry of values.entries) {
      const { data: exp, error: expErr } = await supabase
        .from("expenses")
        .insert([
          {
            expense_report_id: report.id,
            expense_type_id: entry.expense_type_id,
            date_from: entry.date_from,
            date_to: entry.date_to,
            notes: entry.notes,
            amount: entry.amount,
          },
        ])
        .select()
        .single()

      if (expErr) throw expErr

      // Upload files to Supabase Storage and link URLs
      for (const att of entry.attachments) {
        if (att.file) {
          const fileExt = att.file.name.split(".").pop()
          const filePath = `${report.id}/${exp.id}/${Math.random()}.${fileExt}`

          const { error: uploadErr } = await supabase.storage
            .from("expense_attachments")
            .upload(filePath, att.file)

          if (uploadErr) throw uploadErr

          const { data: publicUrlData } = supabase.storage
            .from("expense_attachments")
            .getPublicUrl(filePath)

          await supabase.from("expense_attachments").insert([
            {
              expense_id: exp.id,
              url_link: publicUrlData.publicUrl,
            },
          ])
        }
      }
    }

    toast.dismiss(t)
    toast.success("Expense Report successfully submitted!")
    return report
  } catch (err: unknown) {
    toast.dismiss(t)
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred"
    toast.error(`ERR: ${message}`)
    throw err
  }
}

export async function updateExpenseReport(
  id: string,
  values: ExpenseReportFormValues
) {
  const t = toast.loading("Updating Expense Report...")

  try {
    // Update main header
    const { error: reportErr } = await supabase
      .from("expense_reports")
      .update({
        report_title: values.report_title,
        report_description: values.report_description,
        date_from: values.date_from,
        date_to: values.date_to,
      })
      .eq("id", id)

    if (reportErr) throw reportErr

    // Clean up old entries and insert refreshed ones
    await supabase.from("expenses").delete().eq("expense_report_id", id)

    for (const entry of values.entries) {
      const { data: exp, error: expErr } = await supabase
        .from("expenses")
        .insert([
          {
            expense_report_id: id,
            expense_type_id: entry.expense_type_id,
            date_from: entry.date_from,
            date_to: entry.date_to,
            notes: entry.notes,
            amount: entry.amount,
          },
        ])
        .select()
        .single()

      if (expErr) throw expErr

      for (const att of entry.attachments) {
        let finalUrl = att.url_link
        if (att.file) {
          const fileExt = att.file.name.split(".").pop()
          const filePath = `${id}/${exp.id}/${Math.random()}.${fileExt}`
          await supabase.storage
            .from("expense_attachments")
            .upload(filePath, att.file)
          finalUrl = supabase.storage
            .from("expense_attachments")
            .getPublicUrl(filePath).data.publicUrl
        }

        if (finalUrl) {
          await supabase.from("expense_attachments").insert([
            {
              expense_id: exp.id,
              url_link: finalUrl,
            },
          ])
        }
      }
    }

    toast.dismiss(t)
    toast.success("Expense Report successfully updated!")
  } catch (err: unknown) {
    toast.dismiss(t)
    const message =
      err instanceof Error ? err.message : "An unexpected error occurred"
    toast.error(`ERR: ${message}`)
    throw err
  }
}

export async function deleteExpenseReport(id: string) {
  const t = toast.loading("Deleting Expense Report...")

  const { data, error } = await supabase
    .from("expense_reports")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Expense Report deleted.")
  return data
}
