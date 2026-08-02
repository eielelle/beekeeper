"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import {
  FetchEmployeesParams,
  EmployeeStoreType,
} from "@/forms/queries/employee.query"
import { supabaseAdmin } from "@/lib/supabase/admin" // Used for deletion if needed

// ==========================================
// 1. FETCH ALL EMPLOYEES (PAGINATED)
// ==========================================
export async function fetchEmployeesAction(params: FetchEmployeesParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "employees")) {
    throw new Error("Forbidden: You do not have permission to view employees.")
  }

  const supabase = await createClient()
  let query = supabase.from("employees").select("*", { count: "exact" })

  // --- 1. Global Search ---
  if (params.globalFilter) {
    query = query.or(
      `employee_no.ilike.%${params.globalFilter}%,first_name.ilike.%${params.globalFilter}%,last_name.ilike.%${params.globalFilter}%,email.ilike.%${params.globalFilter}%`
    )
  }

  // --- 2. Dynamic Filters ---
  if (params.gender && params.gender !== "all") {
    query = query.eq("gender", params.gender)
  }

  if (params.role && params.role !== "all") {
    if (params.role === "superuser") {
      query = query.eq("is_superuser", true)
    } else if (params.role === "employee") {
      // Handles both explicit 'false' or empty 'null' values in the DB safely
      query = query.or("is_superuser.eq.false,is_superuser.is.null")
    }
  }

  // --- 3. Sorting ---
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // --- 4. Pagination ---
  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE EMPLOYEE
// ==========================================
export async function getEmployeeAction(id: string) {
  const supabase = await createClient()
  const ability = await getServerAbility()

  // Allow them to read if they have global read access OR if it's their own profile
  if (ability.cannot("read", subject("employees", { employee_id: id }))) {
    throw new Error("Forbidden: You cannot view this employee's profile.")
  }

  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)

  return data
}

// ==========================================
// 3. GET CURRENT EMPLOYEE ID
// ==========================================
export async function getCurrentEmployeeIdAction() {
  const { employeeId } = await fetchUserPermissions()
  if (!employeeId) throw new Error("No employee record found for this account.")
  return String(employeeId)
}

// ==========================================
// 4. CREATE EMPLOYEE
// ==========================================
export async function createEmployeeAction(value: EmployeeStoreType) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (ability.cannot("create", "employees")) {
    throw new Error(
      "Forbidden: You do not have permission to create employees."
    )
  }

  const { data, error } = await supabase
    .from("employees")
    .insert([value])
    .select()
    .single()
  if (error) throw new Error(error.message)

  return data
}

// ==========================================
// 5. UPDATE EMPLOYEE
// ==========================================
export async function updateEmployeeAction(value: EmployeeStoreType) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (!value.id) throw new Error("Employee ID is required.")

  // Security: Check if they can update this specific employee
  if (
    ability.cannot("update", subject("employees", { employee_id: value.id }))
  ) {
    throw new Error(
      "Forbidden: You do not have permission to update this employee."
    )
  }

  const { id, created_at, ...updates } = value

  // SECURITY PATCH: Do not allow non-superusers to escalate privileges
  const { isSuperuser } = await fetchUserPermissions()
  if (!isSuperuser && updates.is_superuser !== undefined) {
    delete updates.is_superuser
  }

  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (error) throw new Error(error.message)

  return data
}

// ==========================================
// 6. SEARCH EMPLOYEE OPTIONS
// ==========================================
export async function searchEmployeeOptionsAction(searchTerm: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "employees")) {
    throw new Error("Forbidden: You do not have permission to view employees.")
  }

  const supabase = await createClient()
  let query = supabase
    .from("employees")
    .select("id, first_name, last_name, employee_no")

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,employee_no.ilike.%${searchTerm}%`
    )
  }

  const { data, error } = await query.limit(20)
  if (error) throw new Error(error.message)

  return (data || []).map((item) => ({
    value: String(item.id),
    label: `${item.first_name} ${item.last_name} (${item.employee_no})`,
  }))
}
