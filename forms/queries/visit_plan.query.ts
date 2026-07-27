import { toast } from "sonner"
import {
  fetchVisitPlansAction,
  getVisitPlanAction,
  createVisitPlanAction,
  updateVisitPlanAction,
  deleteVisitPlanAction,
  searchVisitsAction,
  fetchVisitsByDateRangeAction,
} from "@/actions/visit_plan.action"

export type VisitPlanStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  title: string
  remarks?: string | null
  visit_plan_items?: {
    id: string
    visit_id: string
    visits?: {
      id: string
      start_date: string
      outlets?: {
        outlet_name: string
      }
    }
  }[]
}

export type FetchVisitPlansParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export type CreateVisitPlanPayload = {
  title: string
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  remarks?: string | null
  items: { visit_id: string }[]
}

export async function fetchVisitPlans(params: FetchVisitPlansParams) {
  const t = toast.loading("Fetching Visit Plans. Please wait.")
  try {
    const response = await fetchVisitPlansAction(params)
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

export async function getVisitPlan(id: string) {
  const t = toast.loading("Fetching Visit Plan details. Please wait.")
  try {
    const data = await getVisitPlanAction(id)
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

export async function createVisitPlan(payload: CreateVisitPlanPayload) {
  const t = toast.loading("Creating Visit Plan. Please wait.")
  try {
    const data = await createVisitPlanAction(payload)
    toast.dismiss(t)
    toast.success("Visit Plan successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateVisitPlan(
  id: string,
  payload: CreateVisitPlanPayload
) {
  const t = toast.loading("Updating Visit Plan. Please wait.")
  try {
    const data = await updateVisitPlanAction(id, payload)
    toast.dismiss(t)
    toast.success("Visit Plan successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteVisitPlan(id: string) {
  const t = toast.loading("Deleting Visit Plan. Please wait.")
  try {
    const data = await deleteVisitPlanAction(id)
    toast.dismiss(t)
    toast.success("Visit Plan successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// --- Lookup Helper for Combobox ---
export async function searchVisits(queryText: string = "", limit = 20) {
  try {
    return await searchVisitsAction(queryText, limit)
  } catch (error: unknown) {
    console.error(error)
    return []
  }
}

// --- Auto-Fill Visits by Date Range ---
export async function fetchVisitsByDateRange(
  startDate: string,
  endDate: string
) {
  try {
    return await fetchVisitsByDateRangeAction(startDate, endDate)
  } catch (error: unknown) {
    console.error(error)
    toast.error(
      `ERR: ${error instanceof Error ? error.message : "Failed to fetch visits."}`
    )
    return []
  }
}
