import { toast } from "sonner"
import {
  fetchEmployeesAction,
  getEmployeeAction,
  createEmployeeAction,
  updateEmployeeAction,
  getCurrentEmployeeIdAction,
  searchEmployeeOptionsAction,
} from "@/actions/employee.action"

export type EmployeeStoreType = {
  id?: string | number
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

export async function fetchEmployees(params: FetchEmployeesParams) {
  try {
    return await fetchEmployeesAction(params)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function getEmployee(id: string) {
  try {
    return await getEmployeeAction(id)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// Used securely by the My Outlets page & others
export async function getCurrentEmployeeId() {
  try {
    return await getCurrentEmployeeIdAction()
  } catch (error: any) {
    console.error(error)
    throw error
  }
}

// --- MUTATIONS ---

export async function createEmployee(value: EmployeeStoreType) {
  const t = toast.loading("Creating Employee. Please wait.")
  try {
    const data = await createEmployeeAction(value)
    toast.dismiss(t)
    toast.success("Employee successfully created.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function updateEmployee(value: EmployeeStoreType) {
  const t = toast.loading("Updating Employee. Please wait.")
  try {
    const data = await updateEmployeeAction(value)
    toast.dismiss(t)
    toast.success("Employee successfully updated.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function deleteEmployee(id: string | number) {
  const t = toast.loading("Deleting Employee. Please wait.")
  try {
    // We hit your existing route since it securely handles both DB and Auth deletion via Supabase Admin
    const res = await fetch(`/api/v1/users?id=${id}`, {
      method: "DELETE",
    })

    if (!res.ok) {
      const errData = await res.json()
      throw new Error(
        errData.error || "Failed to delete employee and auth account."
      )
    }

    toast.dismiss(t)
    toast.success("Employee successfully deleted.")
    return await res.json()
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function searchEmployeeOptions(searchTerm: string) {
  try {
    return await searchEmployeeOptionsAction(searchTerm)
  } catch (error: any) {
    console.error(error)
    toast.error(`ERR: ${error.message}`)
    return []
  }
}
