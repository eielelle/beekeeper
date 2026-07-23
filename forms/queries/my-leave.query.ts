import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type MyLeaveStoreType = {
  id?: string | number
  employee_id?: number
  leave_date: string
  reason: string
  created_at?: string
}

export type FetchMyLeavesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  dateRange?: { from?: string; to?: string }
}

// Helper to securely get the logged-in employee's ID
async function getCurrentEmployeeId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (error || !data) throw new Error("Employee profile not found")
  return data.id
}

export async function fetchMyLeaves({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
  dateRange,
}: FetchMyLeavesParams) {
  const t = toast.loading("Fetching your leaves. Please wait.")

  const employeeId = await getCurrentEmployeeId()

  let query = supabase
    .from("leaves")
    .select("*", { count: "exact" })
    .eq("employee_id", employeeId)

  // Search filtering by reason
  if (globalFilter) {
    query = query.ilike("reason", `%${globalFilter}%`)
  }

  // Handle Date Range Filters
  if (dateRange?.from) {
    query = query.gte("leave_date", dateRange.from)
  }
  if (dateRange?.to) {
    query = query.lte("leave_date", dateRange.to)
  }

  // Sorting logic
  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("leave_date", { ascending: false })
  }

  // Pagination logic
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
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getMyLeave(id: string) {
  const t = toast.loading("Fetching Leave record. Please wait.")
  const employeeId = await getCurrentEmployeeId()

  const { data, error } = await supabase
    .from("leaves")
    .select("*")
    .eq("id", id)
    .eq("employee_id", employeeId) // Security check
    .single()

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  return data
}

export async function createMyLeave(
  value: Omit<MyLeaveStoreType, "employee_id">
) {
  const t = toast.loading("Recording Leave. Please wait.")
  const employeeId = await getCurrentEmployeeId()

  const payload = {
    ...value,
    employee_id: employeeId,
  }

  const { data, error } = await supabase.from("leaves").insert([payload])

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  toast.success("Leave successfully recorded.")
  return data
}

export async function updateMyLeave(value: MyLeaveStoreType) {
  const t = toast.loading("Updating Leave. Please wait.")
  const employeeId = await getCurrentEmployeeId()
  const { id, employee_id, created_at, ...updates } = value

  const { data, error } = await supabase
    .from("leaves")
    .update(updates)
    .eq("id", id)
    .eq("employee_id", employeeId) // Security check
    .select()

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  toast.success("Leave successfully updated.")
  return data
}

export async function deleteMyLeave(id: string) {
  const t = toast.loading("Deleting Leave. Please wait.")
  const employeeId = await getCurrentEmployeeId()

  const { data, error } = await supabase
    .from("leaves")
    .delete()
    .eq("id", id)
    .eq("employee_id", employeeId) // Security check

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  toast.success("Leave successfully deleted.")
  return data
}

export const fetchMyLeaveStats = async () => {
  const employeeId = await getCurrentEmployeeId()
  const today = new Date().toISOString().split("T")[0]

  const [totalRes, upcomingRes] = await Promise.all([
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .eq("employee_id", employeeId)
      .gte("leave_date", today),
  ])

  return {
    total: totalRes.count ?? 0,
    upcoming: upcomingRes.count ?? 0,
  }
}
