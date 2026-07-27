import { toast } from "sonner"
import {
  fetchVisitsAction,
  getVisitAction,
  createVisitAction,
  updateVisitAction,
  deleteVisitAction,
  searchOutletsAction,
  searchVisitTypesAction,
} from "@/actions/visit.action"

export type VisitStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  outlet_id: number | string
  visit_type_id: number | string
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  notes?: string | null
  repeats_every?: string | null // 'day', 'week', 'month'
  repeat_on?: string[] | null // ['mon', 'wed', 'fri']

  // Joined relations
  outlets?: {
    id: number | string
    outlet_code: string
    outlet_name: string
  } | null
  visit_types?: {
    id: number | string
    type_name: string
  } | null
}

export type FetchVisitsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchVisits(params: FetchVisitsParams) {
  const t = toast.loading("Fetching Visits. Please wait.")
  try {
    const response = await fetchVisitsAction(params)
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

export async function getVisit(id: string) {
  const t = toast.loading("Fetching Visit details. Please wait.")
  try {
    const data = await getVisitAction(id)
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

export async function createVisit(value: VisitStoreType) {
  const t = toast.loading("Scheduling Visit. Please wait.")
  try {
    const data = await createVisitAction(value)
    toast.dismiss(t)
    toast.success("Visit successfully scheduled.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateVisit(value: VisitStoreType) {
  const t = toast.loading("Updating Visit. Please wait.")
  try {
    const data = await updateVisitAction(value)
    toast.dismiss(t)
    toast.success("Visit successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteVisit(id: string) {
  const t = toast.loading("Deleting Visit. Please wait.")
  try {
    const data = await deleteVisitAction(id)
    toast.dismiss(t)
    toast.success("Visit successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// --- Lookup Helpers ---
export async function searchOutlets(queryText: string = "", limit = 20) {
  try {
    return await searchOutletsAction(queryText, limit)
  } catch (error: unknown) {
    console.error(error)
    return []
  }
}

export async function searchVisitTypes(queryText: string = "", limit = 20) {
  try {
    return await searchVisitTypesAction(queryText, limit)
  } catch (error: unknown) {
    console.error(error)
    return []
  }
}
