"use server"

import { createClient } from "@/lib/supabase-server"
import { getServerAbility } from "@/lib/casl/server"
import type {
  FetchOutletsParams,
  OutletStoreType,
} from "@/forms/queries/outlet.query"

async function getCurrentEmployeeId(supabase: any, userId: string) {
  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", userId)
    .single()
  return data?.id
}

export async function fetchOutletsAction(params: FetchOutletsParams) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const ability = await getServerAbility()
  const employeeId = await getCurrentEmployeeId(supabase, user.id)

  const isManager = ability.can("read", "outlets")
  let query: any

  // --- DATA SCOPING ---
  if (isManager) {
    query = supabase
      .from("outlets")
      .select("*, distributor:distributor_id(outlet_name)", { count: "exact" })
  } else {
    // !inner forces the join to act like a standard query so we can filter on the nested outlet data
    query = supabase
      .from("employee_outlets")
      .select(
        `outlet_id, outlets!inner(*, distributor:distributor_id(outlet_name))`,
        { count: "exact" }
      )
      .eq("employee_id", employeeId)
  }

  // Helper to dynamically target the right column based on the scoping above
  const col = (name: string) => (isManager ? name : `outlets.${name}`)

  // --- FILTERS ---
  if (params.globalFilter) {
    query = query.or(
      `${col("outlet_name")}.ilike.%${params.globalFilter}%,${col("outlet_code")}.ilike.%${params.globalFilter}%`
    )
  }

  if (params.distributorFilter) {
    if (params.distributorFilter === "distributors") {
      query = query.eq(col("is_distributor"), true)
    } else if (params.distributorFilter === "no_distributor") {
      query = query
        .eq(col("is_distributor"), false)
        .is(col("distributor_id"), null)
    } else if (params.distributorFilter === "has_distributor") {
      query = query
        .eq(col("is_distributor"), false)
        .not(col("distributor_id"), "is", null)
    }
  }

  if (params.dateRange?.from)
    query = query.gte(col("created_at"), params.dateRange.from)
  if (params.dateRange?.to)
    query = query.lte(col("created_at"), params.dateRange.to)

  if (params.region) query = query.eq(col("region"), params.region)
  if (params.province) query = query.eq(col("province"), params.province)
  if (params.city) query = query.eq(col("city"), params.city)

  // --- SORTING ---
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    if (isManager) {
      query = query.order(sort.id, { ascending: !sort.desc })
    } else {
      // For standard employees, we sort the joined 'outlets' table using foreignTable
      query = query.order(sort.id, {
        ascending: !sort.desc,
        foreignTable: "outlets",
      })
    }
  } else {
    if (isManager) {
      query = query.order("created_at", { ascending: false })
    } else {
      // Same here: use foreignTable instead of "outlets.created_at"
      query = query.order("created_at", {
        ascending: false,
        foreignTable: "outlets",
      })
    }
  }

  // --- PAGINATION ---
  const from = params.pageIndex * params.pageSize
  const { data, count, error } = await query.range(
    from,
    from + params.pageSize - 1
  )

  if (error) throw new Error(error.message)

  // Normalize data so the frontend receives the exact same array structure regardless of privilege
  const normalizedData = isManager
    ? data
    : (data || []).map((row: any) => row.outlets)

  return { data: normalizedData || [], rowCount: count || 0 }
}

export async function getOutletAction(id: string) {
  const supabase = await createClient()
  // Basic fetch - in a highly secure environment, you could scope this too,
  // but row ID lookups are generally safe if lists are protected.
  const { data, error } = await supabase
    .from("outlets")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)
  return data
}

export async function createOutletAction(value: OutletStoreType) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "outlets"))
    throw new Error("Forbidden: Cannot create outlets.")

  const supabase = await createClient()
  const { data, error } = await supabase.from("outlets").insert([value])
  if (error) throw new Error(error.message)
  return data
}

export async function updateOutletAction(
  id: string,
  value: Partial<OutletStoreType>
) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "outlets"))
    throw new Error("Forbidden: Cannot update outlets.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("outlets")
    .update(value)
    .eq("id", id)
    .select()
  if (error) throw new Error(error.message)
  return data
}

export async function deleteOutletAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "outlets"))
    throw new Error("Forbidden: Cannot delete outlets.")

  const supabase = await createClient()
  const { data, error } = await supabase.from("outlets").delete().eq("id", id)
  if (error) throw new Error(error.message)
  return data
}

export async function fetchOutletStatsAction() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized")

  const ability = await getServerAbility()
  const employeeId = await getCurrentEmployeeId(supabase, user.id)
  const isManager = ability.can("read", "outlets")

  // Helper to build scoped count queries
  const getBase = () =>
    isManager
      ? supabase.from("outlets").select("id", { count: "exact", head: true })
      : supabase
          .from("employee_outlets")
          .select("id, outlets!inner(id)", { count: "exact", head: true })
          .eq("employee_id", employeeId)

  const col = (name: string) => (isManager ? name : `outlets.${name}`)

  const [totalRes, distRes, activeRes, inactiveRes] = await Promise.all([
    getBase(),
    getBase().eq(col("is_distributor"), true),
    getBase().eq(col("is_active"), true),
    getBase().eq(col("is_active"), false),
  ])

  return {
    outlets: totalRes.count ?? 0,
    distributors: distRes.count ?? 0,
    active: activeRes.count ?? 0,
    inactive: inactiveRes.count ?? 0,
  }
}

// Combobox Options
export async function fetchSalesGroupOptionsAction() {
  const supabase = await createClient()
  const { data } = await supabase.from("sales_groups").select("id, name")
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function fetchDistributorOptionsAction(searchTerm?: string) {
  const supabase = await createClient()
  let query = supabase
    .from("outlets")
    .select("id, outlet_name")
    .eq("is_distributor", true)
  if (searchTerm) query = query.ilike("outlet_name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.outlet_name,
  }))
}
