"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { FetchParams } from "@/types/fetch-params"
import { LeaveFormValues } from "@/forms/schemas/leave.schema"

// Helper to resolve current logged-in employee ID
async function getCurrentEmployeeId(supabase: any) {
  const { data: authData, error: authError } = await supabase.auth.getUser()
  if (authError || !authData.user) throw new Error("Unauthorized user.")

  const { data: empData, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", authData.user.id)
    .single()

  if (empError || !empData)
    throw new Error("Could not locate employee profile.")
  return empData.id
}

export async function fetchLeavesAction(params: FetchParams) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "leaves")) {
    throw new Error("Forbidden: You do not have permission to view leaves.")
  }

  const supabase = await createClient()

  let query = supabase.from("leaves").select(
    `
    *,
    employee:employees(first_name, last_name, employee_no)
  `,
    { count: "exact" }
  )

  // 1. GLOBAL FILTER
  if (params.globalFilter) {
    query = query.or(
      `reason.ilike.%${params.globalFilter}%,status.ilike.%${params.globalFilter}%`
    )
  }

  // 2. COLUMN-SPECIFIC FILTERS
  if (params.columnFilters && params.columnFilters.length > 0) {
    params.columnFilters.forEach((filter) => {
      const { id, value } = filter

      if (typeof value === "string") {
        query = query.ilike(id, `%${value}%`)
        return
      }

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

export async function getLeaveAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "leaves")) {
    throw new Error("Forbidden: You cannot view this leave request.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leaves")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function createLeaveAction(value: LeaveFormValues) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "leaves")) {
    throw new Error("Forbidden: You do not have permission to apply for leave.")
  }

  const supabase = await createClient()
  const employeeId = await getCurrentEmployeeId(supabase)

  const payload = {
    ...value,
    employee_id: employeeId,
    status: "pending",
  }

  const { data, error } = await supabase
    .from("leaves")
    .insert([payload])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function updateLeaveAction(
  value: LeaveFormValues & { id: string }
) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "leaves")) {
    throw new Error(
      "Forbidden: You do not have permission to update leave requests."
    )
  }

  const { id, ...updates } = value
  if (!id) throw new Error("Leave ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leaves")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

export async function deleteLeaveAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "leaves")) {
    throw new Error(
      "Forbidden: You do not have permission to delete leave requests."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("leaves")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
