"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchDepartmentsParams,
  DepartmentType,
} from "@/forms/queries/department.query"

export async function fetchDepartmentsAction(params: FetchDepartmentsParams) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "departments")) {
    throw new Error(
      "Forbidden: You do not have permission to view departments."
    )
  }

  const supabase = await createClient()

  // We fetch the manager's name relationally so the data table can display it
  let query = supabase.from("departments").select(
    `
    *,
    manager:employees!department_head_id(first_name, last_name)
  `,
    { count: "exact" }
  )

  if (params.globalFilter) {
    query = query.or(
      `name.ilike.%${params.globalFilter}%,code.ilike.%${params.globalFilter}%`
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

export async function getDepartmentAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "departments")) {
    throw new Error("Forbidden: You cannot view this department.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("departments")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createDepartmentAction(value: DepartmentType) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "departments")) {
    throw new Error(
      "Forbidden: You do not have permission to create departments."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("departments")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateDepartmentAction(value: DepartmentType) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "departments")) {
    throw new Error(
      "Forbidden: You do not have permission to update departments."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Department ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("departments")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteDepartmentAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "departments")) {
    throw new Error(
      "Forbidden: You do not have permission to delete departments."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("departments")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
