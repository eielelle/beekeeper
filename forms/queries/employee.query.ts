import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type EmployeeStoreType = {
  id?: string
  employee_no: string
  first_name: string
  middle_name?: string
  last_name: string
  email?: string
  phone?: string
  gender?: string
  employment_start?: string
  birthdate?: string
  is_superuser?: boolean
  avatar_url?: string
  created_at?: string
}

export type FetchEmployeesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchEmployees({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchEmployeesParams) {
  let query = supabase.from("employees").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.or(
      `employee_no.ilike.%${globalFilter}%,first_name.ilike.%${globalFilter}%,last_name.ilike.%${globalFilter}%,email.ilike.%${globalFilter}%`
    )
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getEmployee(id: string) {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", id)
    .single()

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

// Used securely by the My Outlets page
export async function getCurrentEmployeeId() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    throw new Error("User is not authenticated.")
  }

  // Look up securely by the Auth ID, not the email string
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id) // <-- CHANGED FROM 'email' TO 'user_id'
    .single()

  if (empError || !employee) {
    throw new Error("No employee record found for this account.")
  }

  return String(employee.id)
}

// --- MUTATIONS ---

export async function createEmployee(value: EmployeeStoreType) {
  const t = toast.loading("Creating Employee. Please wait.")

  const { data, error } = await supabase.from("employees").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Employee successfully created.")

  return data
}

export async function updateEmployee(value: EmployeeStoreType) {
  const t = toast.loading("Updating Employee. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Employee successfully updated.")

  return data
}

export async function deleteEmployee(id: string | number) {
  // Hit your existing route and pass the ID as a search parameter
  const res = await fetch(`/api/v1/users?id=${id}`, {
    method: "DELETE",
  })

  if (!res.ok) {
    const errData = await res.json()
    throw new Error(
      errData.error || "Failed to delete employee and auth account."
    )
  }

  return await res.json()
}

export async function searchEmployeeOptions(searchTerm: string) {
  let query = supabase
    .from("employees")
    .select("id, first_name, last_name, employee_no")

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,employee_no.ilike.%${searchTerm}%`
    )
  }

  const { data, error } = await query.limit(20)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    return []
  }

  return (data || []).map((item) => ({
    value: String(item.id),
    label: `${item.first_name} ${item.last_name} (${item.employee_no})`,
  }))
}
