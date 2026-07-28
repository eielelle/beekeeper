"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchEmploymentStatusesParams,
  EmploymentStatusType,
} from "@/forms/queries/employment_status.query"

// ==========================================
// 1. FETCH ALL EMPLOYMENT STATUSES
// ==========================================
export async function fetchEmploymentStatusesAction(
  params: FetchEmploymentStatusesParams
) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "employment_statuses")) {
    throw new Error(
      "Forbidden: You do not have permission to view employment statuses."
    )
  }

  const supabase = await createClient()
  let query = supabase
    .from("employment_statuses")
    .select("*", { count: "exact" })

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
// 2. GET SINGLE EMPLOYMENT STATUS
// ==========================================
export async function getEmploymentStatusAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "employment_statuses")) {
    throw new Error("Forbidden: You cannot view this employment status.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_statuses")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE EMPLOYMENT STATUS
// ==========================================
export async function createEmploymentStatusAction(
  value: EmploymentStatusType
) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "employment_statuses")) {
    throw new Error(
      "Forbidden: You do not have permission to create employment statuses."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_statuses")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE EMPLOYMENT STATUS
// ==========================================
export async function updateEmploymentStatusAction(
  value: EmploymentStatusType
) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "employment_statuses")) {
    throw new Error(
      "Forbidden: You do not have permission to update employment statuses."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Employment Status ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_statuses")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE EMPLOYMENT STATUS
// ==========================================
export async function deleteEmploymentStatusAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "employment_statuses")) {
    throw new Error(
      "Forbidden: You do not have permission to delete employment statuses."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("employment_statuses")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
