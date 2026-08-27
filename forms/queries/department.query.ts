import { toast } from "sonner"
import {
  fetchDepartmentsAction,
  getDepartmentAction,
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
} from "@/actions/department.action"
import { FilterPayload } from "@/types/filter-payloads"

export type DepartmentType = {
  id?: string
  name: string
  code: string
  org_id?: number
  department_head_id?: number | null // <-- Added
  created_at?: string
  // For the Data Table view
  manager?: { first_name: string; last_name: string } | null
}

export type FetchDepartmentsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  columnFilters?: { id: string; value: FilterPayload }[]
}

export async function fetchDepartments(params: FetchDepartmentsParams) {
  const t = toast.loading("Fetching Departments. Please wait.")
  try {
    const response = await fetchDepartmentsAction(params)
    toast.dismiss(t)
    return response
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function getDepartment(id: string) {
  const t = toast.loading("Fetching Department. Please wait.")
  try {
    const data = await getDepartmentAction(id)
    toast.dismiss(t)
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function createDepartment(value: DepartmentType) {
  const t = toast.loading("Creating Department. Please wait.")
  try {
    const data = await createDepartmentAction(value)
    toast.dismiss(t)
    toast.success("Department successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateDepartment(value: DepartmentType) {
  const t = toast.loading("Updating Department. Please wait.")
  try {
    const data = await updateDepartmentAction(value)
    toast.dismiss(t)
    toast.success("Department successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteDepartment(id: string) {
  const t = toast.loading("Deleting Department. Please wait.")
  try {
    const data = await deleteDepartmentAction(id)
    toast.dismiss(t)
    toast.success("Department successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
