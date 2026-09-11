"use server"

import { createClient } from "@/lib/supabase-server"
import { getServerAbility } from "@/lib/casl/server"
import { FetchParams } from "@/types/fetch-params"

// Helper to map the Auth user to your Employees table
async function getCurrentEmployeeId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .single()
  return data?.id
}

// ==========================================
// 1. ADMIN ACTIONS (For /attendance-logs)
// ==========================================

export async function fetchAttendanceLogsAction(params: FetchParams) {
  const ability = await getServerAbility()

  // HARD BLOCK: If they aren't HR/Admin, completely reject the request.
  if (ability.cannot("read", "attendances")) {
    throw new Error(
      "Forbidden: You do not have permission to view company attendance logs."
    )
  }

  const supabase = await createClient()

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
      employee:employees!employee_id(id, first_name, middle_name, last_name, suffix, employee_no, avatar_url)
    `,
    { count: "exact" }
  )

  // 1. GLOBAL FILTER (Searches across multiple columns using OR)
  if (params.globalFilter) {
    query = query.or(
      `name.ilike.%${params.globalFilter}%,code.ilike.%${params.globalFilter}%`
    )
  }

  // 2. NEW: COLUMN-SPECIFIC FILTERS (Searches specific columns using AND)
  if (params.columnFilters && params.columnFilters.length > 0) {
    params.columnFilters.forEach((filter) => {
      const { id, value } = filter

      // 1. Handle basic string payload (from default text inputs)
      if (typeof value === "string") {
        query = query.ilike(id, `%${value}%`)
        return
      }

      // 2. TypeScript now strictly knows `value` is one of our object payloads
      switch (value.operator) {
        case "range":
          if (
            value.min !== null &&
            value.min !== undefined &&
            value.min !== ""
          ) {
            query = query.gte(id, value.min)
          }
          if (
            value.max !== null &&
            value.max !== undefined &&
            value.max !== ""
          ) {
            query = query.lte(id, value.max)
          }
          break

        case "in":
          query = query.in(id, value.values)
          break

        case "eq":
          query = query.eq(id, value.value)
          break

        case "ilike":
          query = query.ilike(id, `%${String(value.value)}%`)
          break
      }
    })
  }

  // 3. SORTING
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    // If the sort is on the manager relation, Supabase handles it slightly differently,
    // but standard columns will sort perfectly here:
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // 4. PAGINATION
  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  console.log(data)

  return { data, rowCount: count || 0 }
}

export async function fetchAttendanceStatsAction(dateRange?: {
  from?: string
  to?: string
}) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "attendances")) {
    throw new Error(
      "Forbidden: You do not have permission to view company stats."
    )
  }

  const supabase = await createClient()

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

export async function fetchMyAttendanceLogsAction(params: FetchParams) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "attendances")) {
    throw new Error("Forbidden: You do not have permission to view employees.")
  }

  const supabase = await createClient()

  let query = supabase.from("attendances").select("*", { count: "exact" })

  // 2. COLUMN-SPECIFIC FILTERS (Searches specific columns using AND)
  if (params.columnFilters && params.columnFilters.length > 0) {
    params.columnFilters.forEach((filter) => {
      const { id, value } = filter

      // 1. Handle basic string payload (from default text inputs)
      if (typeof value === "string") {
        query = query.ilike(id, `%${value}%`)
        return
      }

      // 2. TypeScript now strictly knows `value` is one of our object payloads
      switch (value.operator) {
        case "range":
          if (
            value.min !== null &&
            value.min !== undefined &&
            value.min !== ""
          ) {
            query = query.gte(id, value.min)
          }
          if (
            value.max !== null &&
            value.max !== undefined &&
            value.max !== ""
          ) {
            query = query.lte(id, value.max)
          }
          break

        case "in":
          query = query.in(id, value.values)
          break

        case "eq":
          query = query.eq(id, value.value)
          break

        case "ilike":
          query = query.ilike(id, `%${String(value.value)}%`)
          break
      }
    })
  }

  // 3. SORTING
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // 4. PAGINATION
  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. PERSONAL ACTIONS (For /my-attendances)
// ==========================================
// export async function fetchMyAttendanceLogsAction(
//   params: Omit<FetchAttendanceLogsParams, "employeeId">
// ) {
//   const supabase = await createClient()
//   const {
//     data: { user },
//   } = await supabase.auth.getUser()
//   if (!user) throw new Error("Unauthorized")

//   const currentEmployeeId = await getCurrentEmployeeId(supabase, user.id)

//   let query = supabase.from("attendances").select(
//     `
//       id, time_in, time_out, time_in_lat, time_in_long, time_out_lat, time_out_long,
//       time_in_attachment, time_out_attachment, created_at,
//       employee:employees!employee_id(id, first_name, last_name, employee_no, avatar_url)
//     `,
//     { count: "exact" }
//   )

//   // SECURE LOCK: You can only ever see your own logs
//   query = query.eq("employee_id", currentEmployeeId)

//   if (params.statusFilter === "active") query = query.is("time_out", null)
//   else if (params.statusFilter === "completed")
//     query = query.not("time_out", "is", null)

//   if (params.dateRange?.from)
//     query = query.gte("created_at", params.dateRange.from)
//   if (params.dateRange?.to) query = query.lte("created_at", params.dateRange.to)

//   if (params.sorting && params.sorting.length > 0) {
//     const sort = params.sorting[0]
//     query = query.order(sort.id, { ascending: !sort.desc })
//   } else {
//     query = query.order("created_at", { ascending: false })
//   }

//   const from = params.pageIndex * params.pageSize
//   const { data, error, count } = await query.range(
//     from,
//     from + params.pageSize - 1
//   )

//   if (error) throw new Error(error.message)
//   return { data: data || [], rowCount: count || 0 }
// }

export async function fetchMyAttendanceStatsAction(dateRange?: {
  from?: string
  to?: string
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const currentEmployeeId = await getCurrentEmployeeId(supabase, user.id)

  let baseQuery = supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .eq("employee_id", currentEmployeeId)
  let activeQuery = supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .is("time_out", null)
    .eq("employee_id", currentEmployeeId)
  let completedQuery = supabase
    .from("attendances")
    .select("id", { count: "exact", head: true })
    .not("time_out", "is", null)
    .eq("employee_id", currentEmployeeId)

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

// ==========================================
// 3. STANDARD CRUD (Manual HR interventions)
// ==========================================

export async function createAttendanceAction(value: any) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "attendances"))
    throw new Error("Forbidden: Cannot create logs manually.")

  const supabase = await createClient()
  const { data, error } = await supabase.from("attendances").insert([value])
  if (error) throw new Error(error.message)
  return data
}

export async function updateAttendanceAction(id: string | number, value: any) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "attendances"))
    throw new Error("Forbidden: Cannot update logs.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("attendances")
    .update(value)
    .eq("id", id)
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteAttendanceAction(id: string | number) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "attendances"))
    throw new Error("Forbidden: Cannot delete logs.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("attendances")
    .delete()
    .eq("id", id)
  if (error) throw new Error(error.message)
  return data
}
