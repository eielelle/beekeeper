"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import { triggerApprovalWorkflow } from "./approval.action"
import { FetchLeavesParams, LeaveStoreType } from "@/forms/queries/leave.query"

// ==========================================
// 1. FETCH ALL LEAVES (PAGINATED)
// ==========================================
export async function fetchLeavesAction(params: FetchLeavesParams) {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()

  if (ability.cannot("read", "leaves")) {
    throw new Error("Forbidden: You do not have permission to view leaves.")
  }

  const supabase = await createClient()
  let query = supabase
    .from("leaves")
    .select("*, employee:employee_id(first_name, last_name)", {
      count: "exact",
    })

  // DATA SCOPING: Check if user has global read access (by testing a dummy ID).
  // If not, strictly filter the query to only return their own records.
  const canReadAll = ability.can("read", subject("leaves", { employee_id: -1 }))
  if (!canReadAll) {
    if (!employeeId) throw new Error("Employee profile not found.")
    query = query.eq("employee_id", employeeId)
  }

  if (params.globalFilter)
    query = query.ilike("reason", `%${params.globalFilter}%`)
  if (params.dateRange?.from)
    query = query.gte("leave_date", params.dateRange.from)
  if (params.dateRange?.to) query = query.lte("leave_date", params.dateRange.to)

  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("leave_date", { ascending: false })
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE LEAVE
// ==========================================
export async function getLeaveAction(id: string) {
  const supabase = await createClient()
  const ability = await getServerAbility()

  const { data, error } = await supabase
    .from("leaves")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)

  // Validate they can read this specific record
  if (
    ability.cannot("read", subject("leaves", { employee_id: data.employee_id }))
  ) {
    throw new Error("Forbidden: You cannot view this leave request.")
  }

  return data
}

// ==========================================
// 3. CREATE LEAVE & TRIGGER APPROVAL
// ==========================================
export async function createLeaveAction(value: LeaveStoreType) {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()
  const supabase = await createClient()

  if (ability.cannot("create", "leaves")) {
    throw new Error(
      "Forbidden: You do not have permission to file leave requests."
    )
  }

  // Force employee_id to the logged-in user if they are filing for themselves
  const targetEmployeeId = value.employee_id || employeeId
  if (!targetEmployeeId) throw new Error("Employee ID is required.")

  const { data: leave, error } = await supabase
    .from("leaves")
    .insert([
      {
        employee_id: targetEmployeeId,
        leave_date: value.leave_date,
        reason: value.reason,
        status: "pending", // ALWAYS defaults to pending
      },
    ])
    .select("id, employee_id")
    .single()

  if (error) throw new Error(error.message)

  // TRIGGER THE APPROVAL ENGINE
  const { data: empData } = await supabase
    .from("employees")
    .select("org_id")
    .eq("id", targetEmployeeId)
    .single()
  await triggerApprovalWorkflow(
    "leaves",
    leave.id.toString(),
    targetEmployeeId,
    empData?.org_id || undefined
  )

  return leave
}

// ==========================================
// 4. UPDATE LEAVE
// ==========================================
export async function updateLeaveAction(value: LeaveStoreType) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (!value.id) throw new Error("Leave ID is required for updates.")

  // Fetch existing record to check ownership
  const { data: existing } = await supabase
    .from("leaves")
    .select("*")
    .eq("id", value.id)
    .single()
  if (!existing) throw new Error("Leave record not found.")

  if (
    ability.cannot(
      "update",
      subject("leaves", { employee_id: existing.employee_id })
    )
  ) {
    throw new Error("Forbidden: You cannot update this leave request.")
  }

  // SECURITY FIX: Extract `employee_id` so it is completely stripped from the `updates` object.
  // This guarantees a user cannot re-assign their leave request to another employee.
  const { id, employee, created_at, employee_id, status, ...updates } = value

  const { data, error } = await supabase
    .from("leaves")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE LEAVE
// ==========================================
export async function deleteLeaveAction(id: string) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from("leaves")
    .select("employee_id")
    .eq("id", id)
    .single()
  if (!existing) throw new Error("Leave record not found.")

  if (
    ability.cannot(
      "delete",
      subject("leaves", { employee_id: existing.employee_id })
    )
  ) {
    throw new Error("Forbidden: You cannot delete this leave request.")
  }

  const { data, error } = await supabase
    .from("leaves")
    .delete()
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. FETCH LEAVE STATS
// ==========================================
export async function fetchLeaveStatsAction() {
  const ability = await getServerAbility()

  // ADD THIS CHECK: Block completely if they have zero read permissions
  if (ability.cannot("read", "leaves")) {
    throw new Error(
      "Forbidden: You do not have permission to view leave stats."
    )
  }

  const { employeeId } = await fetchUserPermissions()
  const supabase = await createClient()
  const today = new Date().toISOString().split("T")[0]

  let queryTotal = supabase
    .from("leaves")
    .select("*", { count: "exact", head: true })
  let queryUpcoming = supabase
    .from("leaves")
    .select("*", { count: "exact", head: true })
    .gte("leave_date", today)

  // Scope stats to the user if they don't have global read access
  const canReadAll = ability.can("read", subject("leaves", { employee_id: -1 }))
  if (!canReadAll && employeeId) {
    queryTotal = queryTotal.eq("employee_id", employeeId)
    queryUpcoming = queryUpcoming.eq("employee_id", employeeId)
  }

  const [totalRes, upcomingRes] = await Promise.all([queryTotal, queryUpcoming])

  return {
    total: totalRes.count ?? 0,
    upcoming: upcomingRes.count ?? 0,
  }
}

// ==========================================
// 7. SEARCH EMPLOYEE OPTIONS (FOR DROPDOWNS)
// ==========================================
export async function searchEmployeeOptionsAction(searchTerm: string) {
  const ability = await getServerAbility()

  // CASL check: Ensure they have rights to view the employee directory
  if (ability.cannot("read", "employees")) {
    throw new Error("Forbidden: You do not have permission to view employees.")
  }

  const supabase = await createClient()
  let query = supabase.from("employees").select("id, first_name, last_name")

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`
    )
  }

  const { data, error } = await query.limit(20)

  if (error) throw new Error(error.message)

  return (data || []).map((item) => ({
    value: String(item.id),
    label: `${item.first_name} ${item.last_name}`,
  }))
}

// ==========================================
// 8. FETCH MY LEAVES (STRICTLY SCOPED)
// ==========================================
export async function fetchMyLeavesAction(params: FetchLeavesParams) {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()

  if (!employeeId) throw new Error("Employee profile not found.")

  // Verify they have baseline permission to read their own leaves
  if (ability.cannot("read", subject("leaves", { employee_id: employeeId }))) {
    throw new Error(
      "Forbidden: You do not have permission to view your leaves."
    )
  }

  const supabase = await createClient()
  let query = supabase
    .from("leaves")
    .select("*", { count: "exact" })
    .eq("employee_id", employeeId) // Strictly locked to current user

  if (params.globalFilter)
    query = query.ilike("reason", `%${params.globalFilter}%`)
  if (params.dateRange?.from)
    query = query.gte("leave_date", params.dateRange.from)
  if (params.dateRange?.to) query = query.lte("leave_date", params.dateRange.to)

  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("leave_date", { ascending: false })
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 9. FETCH MY LEAVE STATS
// ==========================================
export async function fetchMyLeaveStatsAction() {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()

  if (
    !employeeId ||
    ability.cannot("read", subject("leaves", { employee_id: employeeId }))
  ) {
    throw new Error(
      "Forbidden: You do not have permission to view your leave stats."
    )
  }

  const supabase = await createClient()
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
