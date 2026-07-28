"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchEmploymentTypesParams,
  EmploymentTypeStoreType,
} from "@/forms/queries/employment_type.query"

// ==========================================
// 1. FETCH ALL EMPLOYMENT TYPES
// ==========================================
export async function fetchEmploymentTypesAction(
  params: FetchEmploymentTypesParams
) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "employment_types")) {
    throw new Error(
      "Forbidden: You do not have permission to view employment types."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("employment_types").select("*", { count: "exact" })

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
// 2. GET SINGLE EMPLOYMENT TYPE
// ==========================================
export async function getEmploymentTypeAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "employment_types")) {
    throw new Error("Forbidden: You cannot view this employment type.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_types")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE EMPLOYMENT TYPE
// ==========================================
export async function createEmploymentTypeAction(
  value: EmploymentTypeStoreType
) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "employment_types")) {
    throw new Error(
      "Forbidden: You do not have permission to create employment types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_types")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE EMPLOYMENT TYPE
// ==========================================
export async function updateEmploymentTypeAction(
  value: EmploymentTypeStoreType
) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "employment_types")) {
    throw new Error(
      "Forbidden: You do not have permission to update employment types."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Employment Type ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_types")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE EMPLOYMENT TYPE
// ==========================================
export async function deleteEmploymentTypeAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "employment_types")) {
    throw new Error(
      "Forbidden: You do not have permission to delete employment types."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_types")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
