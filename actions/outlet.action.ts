"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import {
  FetchOutletsParams,
  OutletStoreType,
} from "@/forms/queries/outlet.query"

// ==========================================
// 1. FETCH ALL OUTLETS (PAGINATED & SCOPED)
// ==========================================
export async function fetchOutletsAction(params: FetchOutletsParams) {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()

  // Verify baseline read access
  if (ability.cannot("read", "outlets")) {
    throw new Error("Forbidden: You do not have permission to view outlets.")
  }

  const supabase = await createClient()
  let query = supabase
    .from("outlets")
    .select("*, distributor:distributor_id(outlet_name)", { count: "exact" })

  // DATA SCOPING: Check if user has global read access vs assigned-only access
  const canReadAll = ability.can(
    "read",
    subject("outlets", { is_assigned: false })
  )

  if (!canReadAll) {
    if (!employeeId) throw new Error("Employee profile not found.")

    // If they can only read assigned, fetch their assigned outlet IDs first
    // (Assumes a standard 'employee_outlets' junction table - adjust table name if different)
    const { data: assigned } = await supabase
      .from("employee_outlets")
      .select("outlet_id")
      .eq("employee_id", employeeId)

    const assignedIds = assigned?.map((a) => a.outlet_id) || []

    if (assignedIds.length === 0) {
      return { data: [], rowCount: 0 } // Return empty if no assignments
    }

    query = query.in("id", assignedIds)
  }

  // --- Apply Filters ---
  if (params.globalFilter) {
    query = query.or(
      `outlet_name.ilike.%${params.globalFilter}%,outlet_code.ilike.%${params.globalFilter}%`
    )
  }
  if (params.distributorFilter)
    query = query.eq("distributor_id", params.distributorFilter)
  if (params.region) query = query.ilike("region", `%${params.region}%`)
  if (params.province) query = query.ilike("province", `%${params.province}%`)
  if (params.city) query = query.ilike("city", `%${params.city}%`)
  if (params.dateRange?.from)
    query = query.gte("created_at", params.dateRange.from)
  if (params.dateRange?.to) query = query.lte("created_at", params.dateRange.to)

  // --- Apply Sorting ---
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // --- Apply Pagination ---
  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE OUTLET
// ==========================================
export async function getOutletAction(id: string) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  // CASL Check applied broadly (you can add assigned scope logic here too if needed)
  if (ability.cannot("read", "outlets")) {
    throw new Error("Forbidden: You cannot view this outlet.")
  }

  const { data, error } = await supabase
    .from("outlets")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)

  return data
}

// ==========================================
// 3. CREATE OUTLET
// ==========================================
export async function createOutletAction(value: OutletStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "outlets")) {
    throw new Error("Forbidden: You do not have permission to create outlets.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("outlets")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE OUTLET
// ==========================================
export async function updateOutletAction(
  id: string,
  updates: Partial<OutletStoreType>
) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "outlets")) {
    throw new Error("Forbidden: You do not have permission to update outlets.")
  }

  // Security: Prevent updating the org_id arbitrarily
  if (updates.org_id !== undefined) delete updates.org_id

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("outlets")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE OUTLET
// ==========================================
export async function deleteOutletAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "outlets")) {
    throw new Error("Forbidden: You do not have permission to delete outlets.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("outlets")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. FETCH STATS
// ==========================================
export async function fetchOutletStatsAction() {
  const ability = await getServerAbility()

  if (ability.cannot("read", "outlets")) {
    throw new Error("Forbidden: You do not have permission to view stats.")
  }

  const supabase = await createClient()

  // Note: Depending on your assigned-only scope, you may want to filter these counts
  // identically to the `fetchOutletsAction`. Keeping it global for now as standard stats behavior.
  const [totalRes, distributorRes, activeRes] = await Promise.all([
    supabase.from("outlets").select("*", { count: "exact", head: true }),
    supabase
      .from("outlets")
      .select("*", { count: "exact", head: true })
      .eq("is_distributor", true),
    supabase
      .from("outlets")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
  ])

  return {
    total: totalRes.count ?? 0,
    distributors: distributorRes.count ?? 0,
    active: activeRes.count ?? 0,
  }
}

// ==========================================
// 7. DROPDOWN OPTION HELPERS
// ==========================================
export async function fetchSalesGroupOptionsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "outlets")) return [] // Soft fail for dropdowns

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_groups")
    .select("id, name")
    .order("name")

  if (error) return []
  return data.map((item) => ({ value: String(item.id), label: item.name }))
}

export async function fetchDistributorOptionsAction(searchTerm?: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "outlets")) return []

  const supabase = await createClient()
  let query = supabase
    .from("outlets")
    .select("id, outlet_name")
    .eq("is_distributor", true)

  if (searchTerm) {
    query = query.ilike("outlet_name", `%${searchTerm}%`)
  }

  const { data, error } = await query.limit(20)
  if (error) return []

  return data.map((item) => ({
    value: String(item.id),
    label: item.outlet_name,
  }))
}
