"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import {
  FetchVisitPlansParams,
  CreateVisitPlanPayload,
} from "@/forms/queries/visit_plan.query"

// ==========================================
// 1. FETCH ALL VISIT PLANS
// ==========================================
export async function fetchVisitPlansAction(params: FetchVisitPlansParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "visit_plans")) {
    throw new Error(
      "Forbidden: You do not have permission to view visit plans."
    )
  }

  const supabase = await createClient()
  let query = supabase
    .from("visit_plans")
    .select(`*, visit_plan_items ( id )`, { count: "exact" })

  if (params.globalFilter) {
    query = query.or(
      `title.ilike.%${params.globalFilter}%,remarks.ilike.%${params.globalFilter}%`
    )
  }

  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("start_date", { ascending: false })
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE VISIT PLAN
// ==========================================
export async function getVisitPlanAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "visit_plans")) {
    throw new Error("Forbidden: You cannot view this visit plan.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visit_plans")
    .select(
      `
      *,
      visit_plan_items (
        id,
        visit_id,
        visits (
          id, start_date, end_date, start_time, end_time,
          outlets ( outlet_name, outlet_code ),
          visit_types ( type_name )
        )
      )
    `
    )
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE VISIT PLAN
// ==========================================
export async function createVisitPlanAction(payload: CreateVisitPlanPayload) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "visit_plans")) {
    throw new Error(
      "Forbidden: You do not have permission to create visit plans."
    )
  }

  const { items, ...planData } = payload
  const supabase = await createClient()

  const { data: plan, error: planError } = await supabase
    .from("visit_plans")
    .insert([planData])
    .select()
    .single()
  if (planError) throw new Error(`Plan creation failed: ${planError.message}`)

  if (items && items.length > 0) {
    const insertItems = items.map((item) => ({
      visit_plan_id: plan.id,
      visit_id: item.visit_id,
    }))
    const { error: itemsError } = await supabase
      .from("visit_plan_items")
      .insert(insertItems)
    if (itemsError)
      throw new Error(`Items attachment failed: ${itemsError.message}`)
  }

  return plan
}

// ==========================================
// 4. UPDATE VISIT PLAN
// ==========================================
export async function updateVisitPlanAction(
  id: string,
  payload: CreateVisitPlanPayload
) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "visit_plans")) {
    throw new Error(
      "Forbidden: You do not have permission to update visit plans."
    )
  }

  const { items, ...planUpdates } = payload
  const supabase = await createClient()

  const { error: planError } = await supabase
    .from("visit_plans")
    .update(planUpdates)
    .eq("id", id)
  if (planError) throw new Error(`Plan update failed: ${planError.message}`)

  const { error: deleteError } = await supabase
    .from("visit_plan_items")
    .delete()
    .eq("visit_plan_id", id)
  if (deleteError) throw new Error("Failed to clear old attached visits.")

  if (items && items.length > 0) {
    const insertItems = items.map((item) => ({
      visit_plan_id: id,
      visit_id: item.visit_id,
    }))
    const { error: itemsError } = await supabase
      .from("visit_plan_items")
      .insert(insertItems)
    if (itemsError)
      throw new Error(`Failed to re-attach visits: ${itemsError.message}`)
  }

  return true
}

// ==========================================
// 5. DELETE VISIT PLAN
// ==========================================
export async function deleteVisitPlanAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "visit_plans")) {
    throw new Error(
      "Forbidden: You do not have permission to delete visit plans."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("visit_plans")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. SEARCH VISITS HELPERS (Scoped Securely)
// ==========================================
async function applyVisitScoping(query: any) {
  const ability = await getServerAbility()
  const { employeeId } = await fetchUserPermissions()

  // If they can't read all visits, restrict to their assigned outlets
  if (ability.cannot("read", subject("visits", { is_assigned: false }))) {
    if (!employeeId) return null // Block if no profile
    const supabase = await createClient()
    const { data: assigned } = await supabase
      .from("employee_outlets")
      .select("outlet_id")
      .eq("employee_id", employeeId)
    const assignedIds = assigned?.map((a) => a.outlet_id) || []
    if (assignedIds.length === 0) return null
    return query.in("outlet_id", assignedIds) // Assumes visits table has outlet_id
  }
  return query
}

export async function searchVisitsAction(queryText: string = "", limit = 20) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "visits")) return []

  const supabase = await createClient()
  let query = supabase
    .from("visits")
    .select(`id, start_date, outlets!inner ( outlet_name )`)
    .order("start_date", { ascending: false })
    .limit(limit)

  query = await applyVisitScoping(query)
  if (!query) return []

  if (queryText.trim()) {
    query = query.ilike("outlets.outlet_name", `%${queryText.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}

export async function fetchVisitsByDateRangeAction(
  startDate: string,
  endDate: string
) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "visits") || !startDate || !endDate) return []

  const supabase = await createClient()
  let query = supabase
    .from("visits")
    .select(
      `
    id, start_date, end_date, start_time, end_time,
    outlets ( outlet_name, outlet_code ),
    visit_types ( type_name )
  `
    )
    .gte("start_date", startDate)
    .lte("start_date", endDate)
    .order("start_date", { ascending: true })

  query = await applyVisitScoping(query)
  if (!query) return []

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data || []
}
