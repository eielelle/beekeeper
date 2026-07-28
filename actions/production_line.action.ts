"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchProductionLinesParams,
  ProductionLineStoreType,
} from "@/forms/queries/production_line.query"

// ==========================================
// 1. FETCH ALL PRODUCTION LINES
// ==========================================
export async function fetchProductionLinesAction(
  params: FetchProductionLinesParams
) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "production_lines")) {
    throw new Error(
      "Forbidden: You do not have permission to view production lines."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("production_lines").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.or(
      `line_name.ilike.%${params.globalFilter}%,line_description.ilike.%${params.globalFilter}%`
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
// 2. GET SINGLE PRODUCTION LINE
// ==========================================
export async function getProductionLineAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "production_lines")) {
    throw new Error("Forbidden: You cannot view this production line.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_lines")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE PRODUCTION LINE
// ==========================================
export async function createProductionLineAction(
  value: ProductionLineStoreType
) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "production_lines")) {
    throw new Error(
      "Forbidden: You do not have permission to create production lines."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_lines")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE PRODUCTION LINE
// ==========================================
export async function updateProductionLineAction(
  value: ProductionLineStoreType
) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "production_lines")) {
    throw new Error(
      "Forbidden: You do not have permission to update production lines."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Production Line ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_lines")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE PRODUCTION LINE
// ==========================================
export async function deleteProductionLineAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "production_lines")) {
    throw new Error(
      "Forbidden: You do not have permission to delete production lines."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("production_lines")
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
export async function searchProductionLinesAction(searchQuery: string = "") {
  const ability = await getServerAbility()

  if (ability.cannot("read", "production_lines")) return []

  const supabase = await createClient()
  let query = supabase
    .from("production_lines")
    .select("id, line_name")
    .order("line_name", { ascending: true })
    .limit(20)

  if (searchQuery.trim()) {
    query = query.ilike("line_name", `%${searchQuery}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return data || []
}
