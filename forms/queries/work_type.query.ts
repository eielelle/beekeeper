import { toast } from "sonner"
import {
  fetchWorkTypesAction,
  getWorkTypeAction,
  createWorkTypeAction,
  updateWorkTypeAction,
  deleteWorkTypeAction,
} from "@/actions/work_type.action"

export type WorkTypeStoreType = {
  id?: string
  name: string
  org_id?: number
  created_at?: string
}

export type FetchWorkTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchWorkTypes(params: FetchWorkTypesParams) {
  const t = toast.loading("Fetching Work Types. Please wait.")
  try {
    const response = await fetchWorkTypesAction(params)
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

export async function getWorkType(id: string) {
  const t = toast.loading("Fetching Work Type. Please wait.")
  try {
    const data = await getWorkTypeAction(id)
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

export async function createWorkType(value: WorkTypeStoreType) {
  const t = toast.loading("Creating Work Type. Please wait.")
  try {
    const data = await createWorkTypeAction(value)
    toast.dismiss(t)
    toast.success("Work Type successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateWorkType(value: WorkTypeStoreType) {
  const t = toast.loading("Updating Work Type. Please wait.")
  try {
    const data = await updateWorkTypeAction(value)
    toast.dismiss(t)
    toast.success("Work Type successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteWorkType(id: string) {
  const t = toast.loading("Deleting Work Type. Please wait.")
  try {
    const data = await deleteWorkTypeAction(id)
    toast.dismiss(t)
    toast.success("Work Type successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
