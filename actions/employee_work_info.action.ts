"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import { EmployeeWorkInfoStoreType } from "@/forms/queries/employee_work_info.query"

// ==========================================
// 1. GET WORK INFO
// ==========================================
export async function getEmployeeWorkInfoAction(employeeId: string) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  // CASL: Block if they cannot read this specific employee's work info
  if (
    ability.cannot(
      "read",
      subject("employee_work_info", { employee_id: employeeId })
    )
  ) {
    throw new Error(
      "Forbidden: You do not have HR permissions to view this work information."
    )
  }

  const { data, error } = await supabase
    .from("employee_work_information")
    .select("*")
    .eq("employee_id", employeeId)
    .single()

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message)
  }

  return data
}

// ==========================================
// 2. UPSERT WORK INFO
// ==========================================
export async function upsertEmployeeWorkInfoAction(
  value: EmployeeWorkInfoStoreType
) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  // CASL: Only users with `manage_employee_work_info` can update this
  if (
    ability.cannot("update", "employee_work_info") &&
    ability.cannot("create", "employee_work_info")
  ) {
    throw new Error(
      "Forbidden: You do not have HR permissions to modify work information."
    )
  }

  const { error } = await supabase
    .from("employee_work_information")
    .upsert([value], { onConflict: "employee_id" })

  if (error) throw new Error(error.message)
  return true
}

// ==========================================
// 3. DROPDOWN QUERIES
// ==========================================
// Note: We tie these to general employee read access since they are just company-wide configurations
export async function searchEmploymentTypesAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("employment_types").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchEmploymentStatusesAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("employment_statuses").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchWorkTypesAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("work_types").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchDepartmentsAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("departments").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchPositionsAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("positions").select("id, title")
  if (searchTerm) query = query.ilike("title", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.title,
  }))
}
