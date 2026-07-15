import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type VisitPlanStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  title: string
  remarks?: string | null
  // Joined relation for the cart items
  visit_plan_items?: {
    id: string
    visit_id: string
    visits?: {
      id: string
      start_date: string
      outlets?: {
        outlet_name: string
      }
    }
  }[]
}

export type FetchVisitPlansParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export type CreateVisitPlanPayload = {
  title: string
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  remarks?: string | null
  items: { visit_id: string }[]
}

export async function fetchVisitPlans({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchVisitPlansParams) {
  const t = toast.loading("Fetching Visit Plans. Please wait.")

  let query = supabase.from("visit_plans").select(
    `
      *,
      visit_plan_items ( id )
    `,
    { count: "exact" }
  )

  if (globalFilter) {
    query = query.or(
      `title.ilike.%${globalFilter}%,remarks.ilike.%${globalFilter}%`
    )
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("start_date", { ascending: false })
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getVisitPlan(id: string) {
  const t = toast.loading("Fetching Visit Plan details. Please wait.")

  const { data, error } = await supabase
    .from("visit_plans")
    .select(
      `
      *,
      visit_plan_items (
        id,
        visit_id,
        visits (
          id,
          start_date,
          end_date,
          start_time,
          end_time,
          outlets ( outlet_name, outlet_code ),
          visit_types ( type_name )
        )
      )
    `
    )
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function createVisitPlan(payload: CreateVisitPlanPayload) {
  const t = toast.loading("Creating Visit Plan. Please wait.")

  const { items, ...planData } = payload

  // 1. Insert the master plan
  const { data: plan, error: planError } = await supabase
    .from("visit_plans")
    .insert([planData])
    .select()
    .single()

  if (planError) {
    toast.dismiss(t)
    toast.error(`ERR: ${planError.message}`)
    throw planError
  }

  // 2. Insert the tied items if any exist
  if (items && items.length > 0) {
    const insertItems = items.map((item) => ({
      visit_plan_id: plan.id,
      visit_id: item.visit_id,
    }))

    const { error: itemsError } = await supabase
      .from("visit_plan_items")
      .insert(insertItems)

    if (itemsError) {
      toast.dismiss(t)
      toast.error(`ERR: Failed to attach visits - ${itemsError.message}`)
      throw itemsError
    }
  }

  toast.dismiss(t)
  toast.success("Visit Plan successfully created.")
  return plan
}

export async function updateVisitPlan(
  id: string,
  payload: CreateVisitPlanPayload
) {
  const t = toast.loading("Updating Visit Plan. Please wait.")

  const { items, ...planUpdates } = payload

  // 1. Update the master plan
  const { error: planError } = await supabase
    .from("visit_plans")
    .update(planUpdates)
    .eq("id", id)

  if (planError) {
    toast.dismiss(t)
    toast.error(`ERR: ${planError.message}`)
    throw planError
  }

  // 2. Clear old tied items
  const { error: deleteError } = await supabase
    .from("visit_plan_items")
    .delete()
    .eq("visit_plan_id", id)

  if (deleteError) {
    toast.dismiss(t)
    toast.error(`ERR: Failed to update attached visits.`)
    throw deleteError
  }

  // 3. Insert new tied items
  if (items && items.length > 0) {
    const insertItems = items.map((item) => ({
      visit_plan_id: id,
      visit_id: item.visit_id,
    }))

    const { error: itemsError } = await supabase
      .from("visit_plan_items")
      .insert(insertItems)

    if (itemsError) {
      toast.dismiss(t)
      toast.error(`ERR: Failed to re-attach visits.`)
      throw itemsError
    }
  }

  toast.dismiss(t)
  toast.success("Visit Plan successfully updated.")
  return true
}

export async function deleteVisitPlan(id: string) {
  const t = toast.loading("Deleting Visit Plan. Please wait.")

  // Deleting the visit_plan will cascade to visit_plan_items based on DB constraint
  const { data, error } = await supabase
    .from("visit_plans")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Visit Plan successfully deleted.")
  return data
}

// --- Lookup Helper for Combobox ---
export async function searchVisits(queryText: string = "", limit = 20) {
  // We use inner join on outlets to allow searching by outlet name
  let query = supabase
    .from("visits")
    .select(
      `
      id,
      start_date,
      outlets!inner ( outlet_name )
    `
    )
    .order("start_date", { ascending: false })
    .limit(limit)

  if (queryText.trim()) {
    query = query.ilike("outlets.outlet_name", `%${queryText.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// --- Auto-Fill Visits by Date Range ---
export async function fetchVisitsByDateRange(
  startDate: string,
  endDate: string
) {
  if (!startDate || !endDate) return []

  const { data, error } = await supabase
    .from("visits")
    .select(
      `
      id,
      start_date,
      end_date,
      start_time,
      end_time,
      outlets ( outlet_name, outlet_code ),
      visit_types ( type_name )
    `
    )
    .gte("start_date", startDate)
    .lte("start_date", endDate)
    .order("start_date", { ascending: true })

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data || []
}
