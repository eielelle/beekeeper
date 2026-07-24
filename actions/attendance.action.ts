"use server"

import { createClient } from "@/lib/supabase-server"
import { getServerAbility } from "@/lib/casl/server"
import type { FetchAttendanceLogsParams } from "@/forms/queries/attendance.query"

// Helper to get the employee ID mapped to the logged-in Auth User
async function getCurrentEmployeeId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .single()
  return data?.id
}

export async function fetchAttendanceLogsAction(
  params: FetchAttendanceLogsParams
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const ability = await getServerAbility()
  const currentEmployeeId = await getCurrentEmployeeId(supabase, user.id)

  let query = supabase.from("attendances").select(
    `
      id,
      time_in,
      time_out,
      time_in_lat,
      time_in_long,
      time_out_lat,
      time_out_long,
      time_in_attachment,
      time_out_attachment,
      created_at,
      employee:employees!employee_id(id, first_name, last_name, employee_no, avatar_url)
    `,
    { count: "exact" }
  )

  // --- DATA SCOPING ---
  if (ability.cannot("read", "attendance")) {
    // Standard Employee: Force query to only return their own logs
    query = query.eq("employee_id", currentEmployeeId)
  } else {
    // Admin / Manager: Can see all, and can apply the frontend employee filter
    if (params.employeeId && params.employeeId !== "all") {
      query = query.eq("employee_id", params.employeeId)
    }
  }

  // --- STANDARD FILTERS ---
  if (params.statusFilter === "active") {
    query = query.is("time_out", null)
  } else if (params.statusFilter === "completed") {
    query = query.not("time_out", "is", null)
  }

  if (params.dateRange?.from) {
    query = query.gte("created_at", params.dateRange.from)
  }
  if (params.dateRange?.to) {
    query = query.lte("created_at", params.dateRange.to)
  }

  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    if (sort.id === "employee_name" || sort.id === "employee_no") {
      query = query.order("created_at", { ascending: false }) // Fallback for nested relations
    } else {
      query = query.order(sort.id, { ascending: !sort.desc })
    }
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // --- PAGINATION ---
  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

export async function fetchAttendanceStatsAction(dateRange?: {
  from?: string
  to?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const ability = await getServerAbility()
  const currentEmployeeId = await getCurrentEmployeeId(supabase, user.id)

  let baseQuery = supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
  let activeQuery = supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .is("time_out", null)
  let completedQuery = supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .not("time_out", "is", null)

  // --- DATA SCOPING ---
  if (ability.cannot("read", "attendance")) {
    baseQuery = baseQuery.eq("employee_id", currentEmployeeId)
    activeQuery = activeQuery.eq("employee_id", currentEmployeeId)
    completedQuery = completedQuery.eq("employee_id", currentEmployeeId)
  }

  // --- FILTERS ---
  if (dateRange?.from) {
    baseQuery = baseQuery.gte("created_at", dateRange.from)
    activeQuery = activeQuery.gte("created_at", dateRange.from)
    completedQuery = completedQuery.gte("created_at", dateRange.from)
  }

  if (dateRange?.to) {
    baseQuery = baseQuery.lte("created_at", dateRange.to)
    activeQuery = activeQuery.lte("created_at", dateRange.to)
    completedQuery = completedQuery.lte("created_at", dateRange.to)
  }

  const [totalRes, activeRes, completedRes] = await Promise.all([
    baseQuery,
    activeQuery,
    completedQuery,
  ])

  return {
    total_logs: totalRes.count || 0,
    active: activeRes.count || 0,
    completed: completedRes.count || 0,
  }
}
