import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ExpenseTypeStoreType = {
  id?: string
  type_name: string
  type_description?: string
  org_id?: number
  created_at?: string
}

export type FetchExpenseTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchExpenseTypes({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchExpenseTypesParams) {
  const t = toast.loading("Fetching Expense Types. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("expense_types").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on type_name)
  if (globalFilter) {
    query = query.ilike("type_name", `%${globalFilter}%`)
  }

  // 3. Server-Side Sorting
  if (sorting && sorting.length > 0) {
    const sort = sorting[0] // Handling single column sorting
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    // Default fallback sort
    query = query.order("created_at", { ascending: false })
  }

  // 4. Server-Side Pagination Range Calc
  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  // Return both data and the total exact count needed by the frontend pagination controls
  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getExpenseType(id: string) {
  const t = toast.loading("Fetching Expense Type. Please wait.")

  const { data, error } = await supabase
    .from("expense_types")
    .select("*")
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function createExpenseType(value: ExpenseTypeStoreType) {
  const t = toast.loading("Creating Expense Type. Please wait.")

  const { data, error } = await supabase.from("expense_types").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Expense Type successfully created.")

  return data
}

export async function updateExpenseType(value: ExpenseTypeStoreType) {
  const t = toast.loading("Updating Expense Type. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("expense_types")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Expense Type successfully updated.")

  return data
}

export async function deleteExpenseType(id: string) {
  const t = toast.loading("Deleting Expense Type. Please wait.")

  const { data, error } = await supabase
    .from("expense_types")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Expense Type successfully deleted.")
  return data
}
