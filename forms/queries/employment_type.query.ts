import { toast } from "sonner"
import {
  fetchEmploymentTypesAction,
  getEmploymentTypeAction,
  createEmploymentTypeAction,
  updateEmploymentTypeAction,
  deleteEmploymentTypeAction,
} from "@/actions/employment_type.action"

export type EmploymentTypeStoreType = {
  id?: string
  name: string
  org_id?: number
  created_at?: string
}

export type FetchEmploymentTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchEmploymentTypes(params: FetchEmploymentTypesParams) {
  const t = toast.loading("Fetching Employment Types. Please wait.")
  try {
    const response = await fetchEmploymentTypesAction(params)
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

export async function getEmploymentType(id: string) {
  const t = toast.loading("Fetching Employment Type. Please wait.")
  try {
    const data = await getEmploymentTypeAction(id)
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

export async function createEmploymentType(value: EmploymentTypeStoreType) {
  const t = toast.loading("Creating Employment Type. Please wait.")
  try {
    const data = await createEmploymentTypeAction(value)
    toast.dismiss(t)
    toast.success("Employment Type successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateEmploymentType(value: EmploymentTypeStoreType) {
  const t = toast.loading("Updating Employment Type. Please wait.")
  try {
    const data = await updateEmploymentTypeAction(value)
    toast.dismiss(t)
    toast.success("Employment Type successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteEmploymentType(id: string) {
  const t = toast.loading("Deleting Employment Type. Please wait.")
  try {
    const data = await deleteEmploymentTypeAction(id)
    toast.dismiss(t)
    toast.success("Employment Type successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
