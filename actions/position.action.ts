"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchPositionsParams,
  PositionType,
} from "@/forms/queries/position.query"

// ==========================================
// 1. FETCH ALL POSITIONS (Paginated/Sorted)
// ==========================================
export async function fetchPositionsAction(params: FetchPositionsParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "positions")) {
    throw new Error("Forbidden: You do not have permission to view positions.")
  }

  const supabase = await createClient()
  let query = supabase.from("positions").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.or(
      `title.ilike.%${params.globalFilter}%,code.ilike.%${params.globalFilter}%`
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
// 2. GET SINGLE POSITION
// ==========================================
export async function getPositionAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "positions")) {
    throw new Error("Forbidden: You cannot view this position.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("positions")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE POSITION
// ==========================================
export async function createPositionAction(value: PositionType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "positions")) {
    throw new Error(
      "Forbidden: You do not have permission to create positions."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("positions")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE POSITION
// ==========================================
export async function updatePositionAction(value: PositionType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "positions")) {
    throw new Error(
      "Forbidden: You do not have permission to update positions."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Position ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("positions")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE POSITION
// ==========================================
export async function deletePositionAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "positions")) {
    throw new Error(
      "Forbidden: You do not have permission to delete positions."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("positions")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
