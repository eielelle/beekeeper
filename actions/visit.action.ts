"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import { VisitStoreType } from "@/forms/queries/visit.query"
import { FetchParams } from "@/types/fetch-params"

// ==========================================
// 1. FETCH ALL VISITS
// ==========================================
export async function fetchVisitsAction(params: FetchParams) {
  const ability = await getServerAbility()

  console.log("IM FIRING")

  if (ability.cannot("read", "visits")) {
    throw new Error("Forbidden: You do not have permission to view visits.")
  }

  const supabase = await createClient()
  let query = supabase.from("visits").select(
    `
      *,
      outlets ( id, outlet_code, outlet_name ),
      visit_types ( id, type_name )
    `,
    { count: "exact" }
  )

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
// 1. FETCH ALL VISITS
// ==========================================
export async function fetchMyVisitsAction(params: FetchParams) {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()

  if (ability.cannot("read", "visits")) {
    throw new Error("Forbidden: You do not have permission to view visits.")
  }

  const supabase = await createClient()
  let query = supabase.from("visits").select(
    `
      *,
      outlets ( id, outlet_code, outlet_name ),
      visit_types ( id, type_name )
    `,
    { count: "exact" }
  )

  // DATA SCOPING: Check if user has global read access vs assigned-only access
  const canReadAll = ability.can(
    "read",
    subject("visits", { is_assigned: false })
  )

  if (!canReadAll) {
    if (!employeeId) throw new Error("Employee profile not found.")

    // Fetch their assigned outlet IDs to filter visits
    const { data: assigned } = await supabase
      .from("employee_outlets")
      .select("outlet_id")
      .eq("employee_id", employeeId)

    const assignedIds = assigned?.map((a) => a.outlet_id) || []

    if (assignedIds.length === 0) {
      return { data: [], rowCount: 0 } // Return empty if no outlet assignments exist
    }

    query = query.in("outlet_id", assignedIds)
  }
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
// 2. GET SINGLE VISIT
// ==========================================
export async function getVisitAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "visits")) {
    throw new Error("Forbidden: You cannot view this visit.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visits")
    .select(
      `*, outlets ( id, outlet_code, outlet_name ), visit_types ( id, type_name )`
    )
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE VISIT
// ==========================================
export async function createVisitAction(value: VisitStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "visits")) {
    throw new Error("Forbidden: You do not have permission to schedule visits.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visits")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE VISIT
// ==========================================
export async function updateVisitAction(value: VisitStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "visits")) {
    throw new Error("Forbidden: You do not have permission to update visits.")
  }

  const { id, outlets, visit_types, created_at, ...updates } = value
  if (!id) throw new Error("Visit ID is required for updating.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visits")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE VISIT
// ==========================================
export async function deleteVisitAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "visits")) {
    throw new Error("Forbidden: You do not have permission to delete visits.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visits")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. LOOKUP HELPERS
// ==========================================
export async function searchOutletsAction(queryText: string = "", limit = 20) {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()

  if (ability.cannot("read", "outlets")) return []

  const supabase = await createClient()
  let query = supabase
    .from("outlets")
    .select("id, outlet_code, outlet_name")
    .order("outlet_name", { ascending: true })
    .limit(limit)

  // Scope the dropdown to assigned outlets if they don't have global read access
  const canReadAllOutlets = ability.can(
    "read",
    subject("outlets", { is_assigned: false })
  )
  if (!canReadAllOutlets && employeeId) {
    const { data: assigned } = await supabase
      .from("employee_outlets")
      .select("outlet_id")
      .eq("employee_id", employeeId)
    const assignedIds = assigned?.map((a) => a.outlet_id) || []
    if (assignedIds.length === 0) return []
    query = query.in("id", assignedIds)
  }

  if (queryText.trim()) {
    query = query.or(
      `outlet_code.ilike.%${queryText.trim()}%,outlet_name.ilike.%${queryText.trim()}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function searchVisitTypesAction(
  queryText: string = "",
  limit = 20
) {
  const supabase = await createClient()
  let query = supabase
    .from("visit_types")
    .select("id, type_name")
    .order("type_name", { ascending: true })
    .limit(limit)

  if (queryText.trim()) {
    query = query.ilike("type_name", `%${queryText.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}
