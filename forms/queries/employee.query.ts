import { toast } from "sonner"
import {
  fetchEmployeesAction,
  getEmployeeAction,
  createEmployeeAction,
  updateEmployeeAction,
  getCurrentEmployeeIdAction,
  searchEmployeeOptionsAction,
} from "@/actions/employee.action"
import type {
  CreateEmployeeFormValues,
  EmployeeFormValues,
} from "../schemas/employee.schema" // <-- 1. Import your new schema type

// You can keep this for fetching lists if your table still uses this flat structure,
// but for mutations (create/update), use the new schema type.
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
  role?: string
  gender?: string
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return String(error)
}

export async function fetchEmployees(params: FetchEmployeesParams) {
  try {
    return await fetchEmployeesAction(params)
  } catch (error) {
    toast.error(`ERR: ${getErrorMessage(error)}`)
    throw error
  }
}

export async function getEmployee(id: string) {
  try {
    return await getEmployeeAction(id)
  } catch (error) {
    toast.error(`ERR: ${getErrorMessage(error)}`)
    throw error
  }
}

export async function getCurrentEmployeeId() {
  try {
    return await getCurrentEmployeeIdAction()
  } catch (error) {
    console.error(error)
    throw error
  }
}

// --- MUTATIONS ---

// 2. Change the parameter to accept either your new Form Values OR FormData
export async function createEmployee(value: CreateEmployeeFormValues) {
  const t = toast.loading("Creating Employee. Please wait.")
  try {
    // If 'value' includes a File, your createEmployeeAction needs to handle it!
    const data = await createEmployeeAction(value)
    toast.dismiss(t)
    toast.success("Employee successfully created.")
    return data
  } catch (error) {
    toast.dismiss(t)
    toast.error(`ERR: ${getErrorMessage(error)}`)
    throw error
  }
}

// 3. Update here as well
export async function updateEmployee(
  id: string | number,
  value: Partial<CreateEmployeeFormValues>
) {
  const t = toast.loading("Updating Employee. Please wait.")
  try {
    // Make sure your update action accepts the ID and the new payload
    const data = await updateEmployeeAction(id, value)
    toast.dismiss(t)
    toast.success("Employee successfully updated.")
    return data
  } catch (error) {
    toast.dismiss(t)
    toast.error(`ERR: ${getErrorMessage(error)}`)
    throw error
  }
}

export async function deleteEmployee(id: string | number) {
  const t = toast.loading("Deleting Employee. Please wait.")
  try {
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
  } catch (error) {
    toast.dismiss(t)
    toast.error(`ERR: ${getErrorMessage(error)}`)
    throw error
  }
}

export async function searchEmployeeOptions(searchTerm: string) {
  try {
    return await searchEmployeeOptionsAction(searchTerm)
  } catch (error) {
    console.error(error)
    toast.error(`ERR: ${getErrorMessage(error)}`)
    return []
  }
}
