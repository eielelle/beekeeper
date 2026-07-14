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
  const t = toast.loading("Fetching Employees. Please wait.")

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

export async function getEmployee(id: string) {
  const t = toast.loading("Fetching Employee. Please wait.")

  const { data, error } = await supabase
    .from("employees")
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

export async function deleteEmployee(id: string) {
  const t = toast.loading("Deleting Employee. Please wait.")

  const { data, error } = await supabase.from("employees").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Employee successfully deleted.")
  return data
}
