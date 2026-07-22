import { supabase } from "@/lib/supabase"

// --- TYPES ---
export type AttendanceLogType = {
  id: number
  time_in: string | null
  time_out: string | null
  time_in_lat: number | null
  time_in_long: number | null
  time_out_lat: number | null
  time_out_long: number | null
  created_at: string
  employee: {
    id: number
    first_name: string | null
    last_name: string | null
    employee_no: string | null
    avatar_url: string | null
  } | null
}

export type FetchAttendanceLogsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  statusFilter?: string
  employeeId?: string
  dateRange?: { from?: string; to?: string }
}

// --- FETCH LOGS (DATA TABLE) ---
export async function fetchAttendanceLogs({
  pageIndex,
  pageSize,
  sorting,
  statusFilter,
  employeeId,
  dateRange,
}: FetchAttendanceLogsParams) {
  let query = supabase.from("attendances").select(
    `
      id,
      time_in,
      time_out,
      time_in_lat,
      time_in_long,
      time_out_lat,
      time_out_long,
      created_at,
      employee:employees!employee_id(id, first_name, last_name, employee_no, avatar_url)
    `,
    { count: "exact" }
  )

  // 1. Employee Filter
  if (employeeId && employeeId !== "all") {
    query = query.eq("employee_id", employeeId)
  }

  // 2. Status Filter (Active vs Completed Shift)
  if (statusFilter === "active") {
    query = query.is("time_out", null)
  } else if (statusFilter === "completed") {
    query = query.not("time_out", "is", null)
  }

  // 3. Date Range Filter
  if (dateRange?.from) {
    query = query.gte("created_at", dateRange.from)
  }
  if (dateRange?.to) {
    query = query.lte("created_at", dateRange.to)
  }

  // 4. Sorting
  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    if (sort.id === "employee_name" || sort.id === "employee_no") {
      query = query.order("created_at", { ascending: false }) // Fallback
    } else {
      query = query.order(sort.id, { ascending: !sort.desc })
    }
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // 5. Pagination
  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: data as unknown as AttendanceLogType[],
    rowCount: count || 0,
  }
}

// --- FETCH STATS (METRICS CARDS) ---
export async function fetchAttendanceStats({
  dateRange,
}: {
  dateRange?: { from?: string; to?: string }
}) {
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
