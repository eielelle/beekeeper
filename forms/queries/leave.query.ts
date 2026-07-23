import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type LeaveStoreType = {
  id?: string | number
  employee_id: number
  leave_date: string
  reason: string
  created_at?: string
  // Joined relation for the UI
  employee?: { first_name: string; last_name: string } | null
}

export type FetchLeavesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  dateRange?: { from?: string; to?: string }
}

export async function fetchLeaves({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
  dateRange,
}: FetchLeavesParams) {
  const t = toast.loading("Fetching Leaves. Please wait.")

  // Join to pull employee names
  let query = supabase
    .from("leaves")
    .select("*, employee:employee_id(first_name, last_name)", {
      count: "exact",
    })

  // Search filtering by reason
  if (globalFilter) {
    query = query.ilike("reason", `%${globalFilter}%`)
  }

  // Handle Date Range Filters for the actual leave_date
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

export async function getLeave(id: string) {
  const t = toast.loading("Fetching Leave record. Please wait.")
  const { data, error } = await supabase
    .from("leaves")
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

export async function createLeave(value: LeaveStoreType) {
  const t = toast.loading("Creating Leave record. Please wait.")
  const { data, error } = await supabase.from("leaves").insert([value])

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  toast.success("Leave successfully recorded.")
  return data
}

export async function updateLeave(value: LeaveStoreType) {
  const t = toast.loading("Updating Leave record. Please wait.")
  const { id, employee, ...updates } = value

  const { data, error } = await supabase
    .from("leaves")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  toast.success("Leave successfully updated.")
  return data
}

export async function deleteLeave(id: string) {
  const t = toast.loading("Deleting Leave record. Please wait.")
  const { data, error } = await supabase.from("leaves").delete().eq("id", id)

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  toast.success("Leave successfully deleted.")
  return data
}

export async function searchEmployeeOptions(searchTerm: string) {
  let query = supabase.from("employees").select("id, first_name, last_name")

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
    )
  }

  const { data } = await query.limit(20)

  return (data || []).map((item) => ({
    value: String(item.id),
    label: `${item.first_name} ${item.last_name}`,
  }))
}

export const fetchLeaveStats = async () => {
  const today = new Date().toISOString().split("T")[0]

  const [totalRes, upcomingRes] = await Promise.all([
    supabase.from("leaves").select("*", { count: "exact", head: true }),
    supabase
      .from("leaves")
      .select("*", { count: "exact", head: true })
      .gte("leave_date", today),
  ])

  return {
    total: totalRes.count ?? 0,
    upcoming: upcomingRes.count ?? 0,
  }
}
