import { toast } from "sonner"
import {
  fetchEmploymentStatusesAction,
  getEmploymentStatusAction,
  createEmploymentStatusAction,
  updateEmploymentStatusAction,
  deleteEmploymentStatusAction,
} from "@/actions/employment_status.action"

export type EmploymentStatusType = {
  id?: string
  name: string
  org_id?: number
  created_at?: string
}

export type FetchEmploymentStatusesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchEmploymentStatuses(
  params: FetchEmploymentStatusesParams
) {
  const t = toast.loading("Fetching Employment Statuses. Please wait.")
  try {
    const response = await fetchEmploymentStatusesAction(params)
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

export async function getEmploymentStatus(id: string) {
  const t = toast.loading("Fetching Employment Status. Please wait.")
  try {
    const data = await getEmploymentStatusAction(id)
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

export async function createEmploymentStatus(value: EmploymentStatusType) {
  const t = toast.loading("Creating Employment Status. Please wait.")
  try {
    const data = await createEmploymentStatusAction(value)
    toast.dismiss(t)
    toast.success("Employment Status successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateEmploymentStatus(value: EmploymentStatusType) {
  const t = toast.loading("Updating Employment Status. Please wait.")
  try {
    const data = await updateEmploymentStatusAction(value)
    toast.dismiss(t)
    toast.success("Employment Status successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteEmploymentStatus(id: string) {
  const t = toast.loading("Deleting Employment Status. Please wait.")
  try {
    const data = await deleteEmploymentStatusAction(id)
    toast.dismiss(t)
    toast.success("Employment Status successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
