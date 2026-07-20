import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// 1. Fetch currently assigned outlet IDs for a specific employee (Fast, lightweight IDs only)
export async function getAssignedOutlets(employeeId: string) {
  const { data, error } = await supabase
    .from("employee_outlets")
    .select("outlet_id")
    .eq("employee_id", employeeId)
    // Explicitly raise limit in case an employee has thousands of assigned outlets
    .limit(10000)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    return []
  }

  return data.map((record) => String(record.outlet_id))
}

// 2. Fetch full details ONLY for a specific page of IDs (Prevents URL overflow)
export async function getOutletsByIds(ids: string[]) {
  if (!ids || ids.length === 0) return []

  const { data, error } = await supabase
    .from("outlets")
    .select("*, distributor:distributor_id(outlet_name)")
    .in("id", ids)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    return []
  }

  return data
}

// 3. Transactional update: clear old assignments and insert new ones (Batched)
export async function assignOutletsToEmployee({
  employeeId,
  outletIds,
}: {
  employeeId: string
  outletIds: string[]
}) {
  const t = toast.loading("Updating assignments...")

  try {
    // 1. Remove existing assignments for this employee
    const { error: deleteError } = await supabase
      .from("employee_outlets")
      .delete()
      .eq("employee_id", employeeId)

    if (deleteError) throw deleteError

    // 2. Insert new assignments in chunks of 500 to prevent REST payload limits
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

        if (insertError) throw insertError
      }
    }

    toast.dismiss(t)
    toast.success("Outlets successfully assigned.")
    return true
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// Add to "@/forms/queries/employee-outlet.query.ts"

export async function fetchMyAssignedOutlets({
  employeeId,
  pageIndex,
  pageSize,
  globalFilter,
}: {
  employeeId: string
  pageIndex: number
  pageSize: number
  globalFilter?: string
}) {
  // Use !inner join to strictly filter Outlets by the junction table
  let query = supabase
    .from("outlets")
    .select(
      "*, distributor:distributor_id(outlet_name), employee_outlets!inner(employee_id)",
      { count: "exact" }
    )
    .eq("employee_outlets.employee_id", employeeId)

  if (globalFilter) {
    query = query.or(
      `outlet_name.ilike.%${globalFilter}%,outlet_code.ilike.%${globalFilter}%`
    )
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1

  query = query.range(from, to).order("outlet_name", { ascending: true })

  const { data, error, count } = await query

  if (error) {
    console.error("Error fetching my outlets:", error.message)
    return { data: [], rowCount: 0 }
  }

  return {
    data: data || [],
    rowCount: count || 0,
  }
}
