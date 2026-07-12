import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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
}

export type FetchOutletsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchOutlets({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchOutletsParams) {
  const t = toast.loading("Fetching Outlets. Please wait.")

  let query = supabase.from("outlets").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.or(
      `outlet_name.ilike.%${globalFilter}%,outlet_code.ilike.%${globalFilter}%,alt_outlet_name.ilike.%${globalFilter}%`
    )
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getOutlet(id: string) {
  const t = toast.loading("Fetching Outlet. Please wait.")

  const { data, error } = await supabase
    .from("outlets")
    .select("*")
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function createOutlet(value: OutletStoreType) {
  const t = toast.loading("Creating Outlet. Please wait.")

  const { data, error } = await supabase.from("outlets").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Outlet successfully created.")

  return data
}

export async function updateOutlet(value: OutletStoreType) {
  const t = toast.loading("Updating Outlet. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("outlets")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Outlet successfully updated.")

  return data
}

export async function deleteOutlet(id: string) {
  const t = toast.loading("Deleting Outlet. Please wait.")

  const { data, error } = await supabase.from("outlets").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Outlet successfully deleted.")
  return data
}

// --- Dynamic Option Helpers for Comboboxes ---
export async function fetchSalesGroupOptions() {
  const { data } = await supabase.from("sales_groups").select("id, name")
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function fetchDistributorOptions() {
  const { data } = await supabase
    .from("outlets")
    .select("id, outlet_name")
    .eq("is_distributor", true)

  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.outlet_name,
  }))
}

export async function searchDistributorOptions(searchTerm: string) {
  let query = supabase
    .from("outlets")
    .select("id, outlet_name")
    .eq("is_distributor", true)

  if (searchTerm) {
    query = query.ilike("outlet_name", `%${searchTerm}%`)
  }

  const { data } = await query.limit(20) // Limit results for performance

  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.outlet_name,
  }))
}
