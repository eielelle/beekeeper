"use server"

import { createClient } from "@/lib/supabase/server"

// 1. ADMIN: Fetch assigned outlet IDs for a specific employee
export async function getAssignedOutletsAction(employeeId: string) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from("employee_outlets")
    .select("outlet_id")
    .eq("employee_id", employeeId)
    .limit(10000)

  if (error) throw new Error(error.message)
  return data.map((record) => String(record.outlet_id))
}

// 2. ADMIN: Fetch full outlet details by an array of IDs
export async function getOutletsByIdsAction(ids: string[]) {
  if (!ids || ids.length === 0) return []

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("outlets")
    .select("*, distributor:distributor_id(outlet_name)")
    .in("id", ids)

  if (error) throw new Error(error.message)
  return data
}

// 3. ADMIN: Update outlet assignments
export async function assignOutletsToEmployeeAction({
  employeeId,
  outletIds,
}: {
  employeeId: string
  outletIds: string[]
}) {
  const supabase = await createClient()

  // Remove existing assignments
  const { error: deleteError } = await supabase
    .from("employee_outlets")
    .delete()
    .eq("employee_id", employeeId)

  if (deleteError) throw new Error(deleteError.message)

  // Insert new assignments in chunks
  if (outletIds.length > 0) {
    const insertPayload = outletIds.map((outletId) => ({
      employee_id: employeeId,
      outlet_id: outletId,
    }))

    const chunkSize = 500
    for (let i = 0; i < insertPayload.length; i += chunkSize) {
      const batch = insertPayload.slice(i, i + chunkSize)
      const { error: insertError } = await supabase
        .from("employee_outlets")
        .insert(batch)

      if (insertError) throw new Error(insertError.message)
    }
  }

  return true
}

// 4. EMPLOYEE: Securely fetch assigned outlets based on Auth Session
export async function fetchMyAssignedOutletsAction(params: {
  pageIndex: number
  pageSize: number
  globalFilter?: string
}) {
  const supabase = await createClient()

  // Securely get the authenticated user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()
  if (authError || !user) throw new Error("Unauthorized: Please log in.")

  // Find employee mapping
  const { data: employee, error: empError } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (empError || !employee) throw new Error("Employee profile not found.")

  let query = supabase
    .from("outlets")
    .select(
      "*, distributor:distributor_id(outlet_name), employee_outlets!inner(employee_id)",
      { count: "exact" }
    )
    .eq("employee_outlets.employee_id", employee.id)

  if (params.globalFilter) {
    query = query.or(
      `outlet_name.ilike.%${params.globalFilter}%,outlet_code.ilike.%${params.globalFilter}%`
    )
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1

  query = query.range(from, to).order("outlet_name", { ascending: true })

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return {
    data: data || [],
    rowCount: count || 0,
  }
}
