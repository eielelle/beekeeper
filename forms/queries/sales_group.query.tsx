import { toast } from "sonner"
import {
  fetchSalesGroupsAction,
  getSalesGroupAction,
  createSalesGroupAction,
  updateSalesGroupAction,
  deleteSalesGroupAction,
  searchSalesGroupOptionsAction,
} from "@/actions/sales_group.action"

export type SalesGroupStoreType = {
  id?: string
  name: string
  org_id?: number
  created_at?: string
}

export type FetchSalesGroupsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSalesGroups(params: FetchSalesGroupsParams) {
  const t = toast.loading("Fetching Sales Groups. Please wait.")
  try {
    const response = await fetchSalesGroupsAction(params)
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

export async function getSalesGroup(id: string) {
  const t = toast.loading("Fetching Sales Group. Please wait.")
  try {
    const data = await getSalesGroupAction(id)
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

export async function createSalesGroup(value: SalesGroupStoreType) {
  const t = toast.loading("Creating Sales Group. Please wait.")
  try {
    const data = await createSalesGroupAction(value)
    toast.dismiss(t)
    toast.success("Sales Group successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateSalesGroup(value: SalesGroupStoreType) {
  const t = toast.loading("Updating Sales Group. Please wait.")
  try {
    const data = await updateSalesGroupAction(value)
    toast.dismiss(t)
    toast.success("Sales Group successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteSalesGroup(id: string) {
  const t = toast.loading("Deleting Sales Group. Please wait.")
  try {
    const data = await deleteSalesGroupAction(id)
    toast.dismiss(t)
    toast.success("Sales Group successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function searchSalesGroupOptions(searchTerm: string) {
  try {
    return await searchSalesGroupOptionsAction(searchTerm)
  } catch (error: unknown) {
    console.error(error)
    return []
  }
}
