import { toast } from "sonner"
import {
  fetchVisitTypesAction,
  getVisitTypeAction,
  createVisitTypeAction,
  updateVisitTypeAction,
  deleteVisitTypeAction,
  searchVisitTypeOptionsAction,
} from "@/actions/visit_type.action"

export type VisitTypeStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  type_name: string
  description?: string
}

export type FetchVisitTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchVisitTypes(params: FetchVisitTypesParams) {
  const t = toast.loading("Fetching Visit Types. Please wait.")
  try {
    const response = await fetchVisitTypesAction(params)
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

export async function getVisitType(id: string) {
  const t = toast.loading("Fetching Visit Type. Please wait.")
  try {
    const data = await getVisitTypeAction(id)
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

export async function createVisitType(value: VisitTypeStoreType) {
  const t = toast.loading("Creating Visit Type. Please wait.")
  try {
    const data = await createVisitTypeAction(value)
    toast.dismiss(t)
    toast.success("Visit Type successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateVisitType(value: VisitTypeStoreType) {
  const t = toast.loading("Updating Visit Type. Please wait.")
  try {
    const data = await updateVisitTypeAction(value)
    toast.dismiss(t)
    toast.success("Visit Type successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteVisitType(id: string) {
  const t = toast.loading("Deleting Visit Type. Please wait.")
  try {
    const data = await deleteVisitTypeAction(id)
    toast.dismiss(t)
    toast.success("Visit Type successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// --- Helper for Comboboxes in other forms ---
export async function searchVisitTypeOptions(
  queryText: string = "",
  limit = 20
) {
  try {
    return await searchVisitTypeOptionsAction(queryText, limit)
  } catch (error: unknown) {
    console.error(error)
    return []
  }
}
