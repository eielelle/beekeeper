import { toast } from "sonner"
import {
  fetchOutletsAction,
  getOutletAction,
  createOutletAction,
  updateOutletAction,
  deleteOutletAction,
  fetchOutletStatsAction,
  fetchSalesGroupOptionsAction,
  fetchDistributorOptionsAction,
} from "@/actions/outlet.action"

export type OutletStoreType = {
  id?: string
  sales_group_id?: number
  outlet_name: string
  outlet_code: string
  address?: string
  region?: string
  province?: string
  city?: string
  barangay?: string
  distributor_id?: number
  is_distributor?: boolean
  is_active?: boolean
  long: number
  lat: number
  geofence_radius: number
  org_id?: number
  created_at?: string
  distributor?: { outlet_name: string } | null
}

export type FetchOutletsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  distributorFilter?: string
  dateRange?: { from?: string; to?: string }
  region?: string
  province?: string
  city?: string
}

export async function fetchOutlets(params: FetchOutletsParams) {
  const t = toast.loading("Fetching Outlets. Please wait.")
  try {
    const response = await fetchOutletsAction(params)
    toast.dismiss(t)
    return response
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function getOutlet(id: string) {
  const t = toast.loading("Fetching Outlet. Please wait.")
  try {
    const data = await getOutletAction(id)
    toast.dismiss(t)
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function createOutlet(value: OutletStoreType) {
  const t = toast.loading("Creating Outlet. Please wait.")
  try {
    const data = await createOutletAction(value)
    toast.dismiss(t)
    toast.success("Outlet successfully created.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function updateOutlet(value: OutletStoreType) {
  const t = toast.loading("Updating Outlet. Please wait.")
  try {
    const { id, ...updates } = value
    if (!id) throw new Error("Outlet ID is required for updating")

    const data = await updateOutletAction(id, updates)
    toast.dismiss(t)
    toast.success("Outlet successfully updated.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

export async function deleteOutlet(id: string) {
  const t = toast.loading("Deleting Outlet. Please wait.")
  try {
    const data = await deleteOutletAction(id)
    toast.dismiss(t)
    toast.success("Outlet successfully deleted.")
    return data
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// --- Dynamic Option Helpers for Comboboxes ---
export async function fetchSalesGroupOptions() {
  return await fetchSalesGroupOptionsAction()
}

export async function fetchDistributorOptions() {
  return await fetchDistributorOptionsAction()
}

export async function searchDistributorOptions(searchTerm: string) {
  return await fetchDistributorOptionsAction(searchTerm)
}

export const fetchOutletStats = async () => {
  return await fetchOutletStatsAction()
}
