"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchShiftTypesParams,
  ShiftTypeStoreType,
} from "@/forms/queries/shift_type.query"

// ==========================================
// 1. FETCH ALL SHIFT TYPES
// ==========================================
export async function fetchShiftTypesAction(params: FetchShiftTypesParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "shift_types")) {
    throw new Error(
      "Forbidden: You do not have permission to view shift types."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("shift_types").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.ilike("name", `%${params.globalFilter}%`)
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
// 2. GET SINGLE SHIFT TYPE
// ==========================================
export async function getShiftTypeAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "shift_types")) {
    throw new Error("Forbidden: You cannot view this shift type.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shift_types")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE SHIFT TYPE
// ==========================================
export async function createShiftTypeAction(value: ShiftTypeStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "shift_types")) {
    throw new Error(
      "Forbidden: You do not have permission to create shift types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shift_types")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE SHIFT TYPE
// ==========================================
export async function updateShiftTypeAction(value: ShiftTypeStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "shift_types")) {
    throw new Error(
      "Forbidden: You do not have permission to update shift types."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Shift Type ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shift_types")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE SHIFT TYPE
// ==========================================
export async function deleteShiftTypeAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "shift_types")) {
    throw new Error(
      "Forbidden: You do not have permission to delete shift types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("shift_types")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
