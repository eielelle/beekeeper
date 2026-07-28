"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchProductionAreasParams,
  ProductionAreaStoreType,
} from "@/forms/queries/production_area.query"

// ==========================================
// 1. FETCH ALL PRODUCTION AREAS
// ==========================================
export async function fetchProductionAreasAction(
  params: FetchProductionAreasParams
) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "production_areas")) {
    throw new Error(
      "Forbidden: You do not have permission to view production areas."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("production_areas").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.or(
      `area_code.ilike.%${params.globalFilter}%,area_name.ilike.%${params.globalFilter}%`
    )
  }

  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE PRODUCTION AREA
// ==========================================
export async function getProductionAreaAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "production_areas")) {
    throw new Error("Forbidden: You cannot view this production area.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_areas")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE PRODUCTION AREA
// ==========================================
export async function createProductionAreaAction(
  value: ProductionAreaStoreType
) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "production_areas")) {
    throw new Error(
      "Forbidden: You do not have permission to create production areas."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_areas")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE PRODUCTION AREA
// ==========================================
export async function updateProductionAreaAction(
  value: ProductionAreaStoreType
) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "production_areas")) {
    throw new Error(
      "Forbidden: You do not have permission to update production areas."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Production Area ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_areas")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE PRODUCTION AREA
// ==========================================
export async function deleteProductionAreaAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "production_areas")) {
    throw new Error(
      "Forbidden: You do not have permission to delete production areas."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_areas")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. COMBOBOX HELPER
// ==========================================
export async function searchProductionAreasAction(searchQuery: string = "") {
  const ability = await getServerAbility()

  if (ability.cannot("read", "production_areas")) return []

  const supabase = await createClient()
  let query = supabase
    .from("production_areas")
    .select("id, area_code, area_name")
    .order("area_name", { ascending: true })
    .limit(20)

  if (searchQuery.trim()) {
    query = query.or(
      `area_code.ilike.%${searchQuery}%,area_name.ilike.%${searchQuery}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data || []
}
