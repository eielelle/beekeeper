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

  let query = supabase.from("departments").select(
    `
    *,
    manager:employees!department_head_id(first_name, last_name)
  `,
    { count: "exact" }
  )

  console.log("BACKEND RECEIVED FILTERS:", params.columnFilters)

  // 1. GLOBAL FILTER (Searches across multiple columns using OR)
  if (params.globalFilter) {
    query = query.or(
      `name.ilike.%${params.globalFilter}%,code.ilike.%${params.globalFilter}%`
    )
  }

  // 2. NEW: COLUMN-SPECIFIC FILTERS (Searches specific columns using AND)
  if (params.columnFilters && params.columnFilters.length > 0) {
    params.columnFilters.forEach((filter) => {
      const { id, value } = filter

      // 1. Handle basic string payload (from default text inputs)
      if (typeof value === "string") {
        query = query.ilike(id, `%${value}%`)
        return
      }

      // 2. TypeScript now strictly knows `value` is one of our object payloads
      switch (value.operator) {
        case "range":
          if (
            value.min !== null &&
            value.min !== undefined &&
            value.min !== ""
          ) {
            query = query.gte(id, value.min)
          }
          if (
            value.max !== null &&
            value.max !== undefined &&
            value.max !== ""
          ) {
            query = query.lte(id, value.max)
          }
          break

        case "in":
          query = query.in(id, value.values)
          break

        case "eq":
          query = query.eq(id, value.value)
          break

        case "ilike":
          query = query.ilike(id, `%${String(value.value)}%`)
          break
      }
    })
  }

  // 3. SORTING
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    // If the sort is on the manager relation, Supabase handles it slightly differently,
    // but standard columns will sort perfectly here:
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // 4. PAGINATION
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
