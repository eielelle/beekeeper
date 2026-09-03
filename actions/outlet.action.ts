"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import {
  FetchOutletsParams,
  OutletStoreType,
} from "@/forms/queries/outlet.query"

export async function fetchMyAssignedOutletsAction(params: {
  pageIndex: number
  pageSize: number
  globalFilter?: string
}) {
  // 1. Securely identify the current authenticated employee
  const { employeeId } = await fetchUserPermissions()

  if (!employeeId) {
    throw new Error("Employee profile not found.")
  }

  const supabase = await createClient()

  // 2. Find the outlet IDs assigned to this employee
  const { data: assigned } = await supabase
    .from("employee_outlets")
    .select("outlet_id")
    .eq("employee_id", employeeId)

  const assignedIds = assigned?.map((a) => a.outlet_id) || []

  // If no assignments, return early
  if (assignedIds.length === 0) {
    return { data: [], rowCount: 0 }
  }

  // 3. Fetch the actual outlet details for those IDs
  let query = supabase
    .from("outlets")
    .select("*, distributor:distributor_id(outlet_name)", { count: "exact" })
    .in("id", assignedIds)

  if (params.globalFilter) {
    query = query.or(
      `outlet_name.ilike.%${params.globalFilter}%,outlet_code.ilike.%${params.globalFilter}%`
    )
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to).order("outlet_name", { ascending: true })

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 1. FETCH ALL OUTLETS (PAGINATED & SCOPED)
// ==========================================
export async function fetchOutletsAction(params: FetchOutletsParams) {
  const ability = await getServerAbility()

  // Verify baseline read access
  if (ability.cannot("read", "outlets")) {
    throw new Error("Forbidden: You do not have permission to view outlets.")
  }

  const supabase = await createClient()
  let query = supabase
    .from("outlets")
    .select("*, distributor:distributor_id(outlet_name)", { count: "exact" })

  console.log("BACKEND RECEIVED FILTERS:", params.columnFilters)

  // 1. GLOBAL FILTER (Searches across multiple columns using OR)
  if (params.globalFilter) {
    query = query.or(
      `name.ilike.%${params.globalFilter}%,code.ilike.%${params.globalFilter}%`
    )
  }

  // 2. NEW: COLUMN-SPECIFIC FILTERS (Searches specific columns using AND)
  if (params.columnFilters && params.columnFilters.length > 0) {
    params.columnFilters.forEach((filter) => {
      const { id, value } = filter

      // 1. Handle basic string payload (from default text inputs)
      if (typeof value === "string") {
        query = query.ilike(id, `%${value}%`)
        return
      }

      // 2. TypeScript now strictly knows `value` is one of our object payloads
      switch (value.operator) {
        case "range":
          if (
            value.min !== null &&
            value.min !== undefined &&
            value.min !== ""
          ) {
            query = query.gte(id, value.min)
          }
          if (
            value.max !== null &&
            value.max !== undefined &&
            value.max !== ""
          ) {
            query = query.lte(id, value.max)
          }
          break

        case "in":
          query = query.in(id, value.values)
          break

        case "eq":
          query = query.eq(id, value.value)
          break

        case "ilike":
          query = query.ilike(id, `%${String(value.value)}%`)
          break
      }
    })
  }

  // 3. SORTING
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    // If the sort is on the manager relation, Supabase handles it slightly differently,
    // but standard columns will sort perfectly here:
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // 4. PAGINATION
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
