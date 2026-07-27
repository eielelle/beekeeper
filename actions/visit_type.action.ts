"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchVisitTypesParams,
  VisitTypeStoreType,
} from "@/forms/queries/visit_type.query"

// ==========================================
// 1. FETCH ALL VISIT TYPES
// ==========================================
export async function fetchVisitTypesAction(params: FetchVisitTypesParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "visit_types")) {
    throw new Error(
      "Forbidden: You do not have permission to view visit types."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("visit_types").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.or(
      `type_name.ilike.%${params.globalFilter}%,description.ilike.%${params.globalFilter}%`
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
// 2. GET SINGLE VISIT TYPE
// ==========================================
export async function getVisitTypeAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "visit_types")) {
    throw new Error("Forbidden: You cannot view this visit type.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visit_types")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE VISIT TYPE
// ==========================================
export async function createVisitTypeAction(value: VisitTypeStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "visit_types")) {
    throw new Error(
      "Forbidden: You do not have permission to create visit types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visit_types")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE VISIT TYPE
// ==========================================
export async function updateVisitTypeAction(value: VisitTypeStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "visit_types")) {
    throw new Error(
      "Forbidden: You do not have permission to update visit types."
    )
  }

  const { id, ...updates } = value
  if (!id) throw new Error("Visit Type ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visit_types")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE VISIT TYPE
// ==========================================
export async function deleteVisitTypeAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "visit_types")) {
    throw new Error(
      "Forbidden: You do not have permission to delete visit types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visit_types")
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
export async function searchVisitTypeOptionsAction(
  queryText: string = "",
  limit = 20
) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "visit_types")) return []

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
