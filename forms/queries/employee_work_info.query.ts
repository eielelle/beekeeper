import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type EmployeeWorkInfoStoreType = {
  id?: string | number
  employee_id: number
  employment_type_id?: number
  employment_status_id?: number
  work_type_id?: string
  department_id?: number
  position_id?: number
  sss_no?: string
  tin_no?: string
  philhealth_no?: string
  pagibig_no?: string
  emergency_contact_name?: string
  emergency_contact_no?: string
  emergency_relation?: string
  allow_overtime?: boolean
}

// --- CRUD Operations ---

export async function getEmployeeWorkInfo(employeeId: string) {
  const { data, error } = await supabase
    .from("employee_work_information")
    .select("*")
    .eq("employee_id", employeeId)
    .single()

  if (error && error.code !== "PGRST116") {
    // Ignore "No rows found" error
    toast.error(`ERR: ${error.message}`)
    return null
  }
  return data
}

export async function upsertEmployeeWorkInfo(value: EmployeeWorkInfoStoreType) {
  const t = toast.loading("Saving work information...")

  // If we already have an ID, we update. Otherwise, we insert.
  const { error } = await supabase
    .from("employee_work_information")
    .upsert([value], { onConflict: "employee_id" })

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Work information successfully saved.")
  return true
}

// --- Dropdown Search Queries ---

export async function searchEmploymentTypes(searchTerm: string) {
  let query = supabase.from("employment_types").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchEmploymentStatuses(searchTerm: string) {
  let query = supabase.from("employment_statuses").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchWorkTypes(searchTerm: string) {
  let query = supabase.from("work_types").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchDepartments(searchTerm: string) {
  let query = supabase.from("departments").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchPositions(searchTerm: string) {
  // Note: Your schema uses 'title' for positions, not 'name'
  let query = supabase.from("positions").select("id, title")
  if (searchTerm) query = query.ilike("title", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.title,
  }))
}
