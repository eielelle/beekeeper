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
  // Added to handle the self-joined distributor data for the UI
  distributor?: { outlet_name: string } | null
}

export type FetchOutletsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  // New filter options
  distributorFilter?: string
  dateRange?: { from?: string; to?: string }
  region?: string
  province?: string
  city?: string
}

export async function fetchOutlets({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
  distributorFilter,
  dateRange,
  region,
  province,
  city,
}: FetchOutletsParams) {
  const t = toast.loading("Fetching Outlets. Please wait.")

  // Added a join to pull the name of the distributor from the same table via distributor_id
  let query = supabase
    .from("outlets")
    // Use the column name directly to target the parent record
    .select("*, distributor:distributor_id(outlet_name)", { count: "exact" })

  // Global search filtering
  if (globalFilter) {
    query = query.or(
      `outlet_name.ilike.%${globalFilter}%,outlet_code.ilike.%${globalFilter}%`
    )
  }

  // Handle Distributor Dropdown Filter logic
  if (distributorFilter) {
    if (distributorFilter === "distributors") {
      query = query.eq("is_distributor", true)
    } else if (distributorFilter === "no_distributor") {
      query = query.eq("is_distributor", false).is("distributor_id", null)
    } else if (distributorFilter === "has_distributor") {
      query = query
        .eq("is_distributor", false)
        .not("distributor_id", "is", null)
    }
  }

  // Handle Created At Date Range Filters
  if (dateRange?.from) {
    query = query.gte("created_at", dateRange.from)
  }
  if (dateRange?.to) {
    query = query.lte("created_at", dateRange.to)
  }

  // Sorting logic
  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  if (region) query = query.eq("region", region)
  if (province) query = query.eq("province", province)
  if (city) query = query.eq("city", city)

  // Pagination logic
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

// Add this to your imports if you don't already have it
// import { createClient } from "@/utils/supabase/client" (or however your supabase client is configured)

export const fetchOutletStats = async () => {
  const [totalRes, distRes, activeRes, inactiveRes] = await Promise.all([
    // Count all records (or add .eq('is_distributor', false) if you only want standard outlets)
    supabase.from("outlets").select("*", { count: "exact", head: true }),
    // Count distributors
    supabase
      .from("outlets")
      .select("*", { count: "exact", head: true })
      .eq("is_distributor", true),
    // Count active
    supabase
      .from("outlets")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    // Count inactive
    supabase
      .from("outlets")
      .select("*", { count: "exact", head: true })
      .eq("is_active", false),
  ])

  return {
    outlets: totalRes.count ?? 0,
    distributors: distRes.count ?? 0,
    active: activeRes.count ?? 0,
    inactive: inactiveRes.count ?? 0,
  }
}
