"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchWorkTypesParams,
  WorkTypeStoreType,
} from "@/forms/queries/work_type.query"

// ==========================================
// 1. FETCH ALL WORK TYPES
// ==========================================
export async function fetchWorkTypesAction(params: FetchWorkTypesParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "work_types")) {
    throw new Error("Forbidden: You do not have permission to view work types.")
  }

  const supabase = await createClient()
  let query = supabase.from("work_types").select("*", { count: "exact" })

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
// 2. GET SINGLE WORK TYPE
// ==========================================
export async function getWorkTypeAction(id: string) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (ability.cannot("read", "work_types")) {
    throw new Error("Forbidden: You cannot view this work type.")
  }

  const { data, error } = await supabase
    .from("work_types")
    .select("*")
    .eq("id", id)
    .single()
  if (error) throw new Error(error.message)

  return data
}

// ==========================================
// 3. CREATE WORK TYPE
// ==========================================
export async function createWorkTypeAction(value: WorkTypeStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "work_types")) {
    throw new Error(
      "Forbidden: You do not have permission to create work types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_types")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE WORK TYPE
// ==========================================
export async function updateWorkTypeAction(value: WorkTypeStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "work_types")) {
    throw new Error(
      "Forbidden: You do not have permission to update work types."
    )
  }

  const { id, ...updates } = value
  if (!id) throw new Error("Work Type ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_types")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE WORK TYPE
// ==========================================
export async function deleteWorkTypeAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "work_types")) {
    throw new Error(
      "Forbidden: You do not have permission to delete work types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("work_types")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
