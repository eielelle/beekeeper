import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type VisitStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  outlet_id: number | string
  visit_type_id: number | string
  start_date: string
  end_date: string
  start_time?: string | null
  end_time?: string | null
  notes?: string | null
  repeats_every?: string | null // 'day', 'week', 'month'
  repeat_on?: string[] | null // ['mon', 'wed', 'fri']

  // Joined relations
  outlets?: {
    id: number | string
    outlet_code: string
    outlet_name: string
  } | null
  visit_types?: {
    id: number | string
    type_name: string
  } | null
}

export type FetchVisitsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchVisits({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchVisitsParams) {
  const t = toast.loading("Fetching Visits. Please wait.")

  let query = supabase.from("visits").select(
    `
      *,
      outlets ( id, outlet_code, outlet_name ),
      visit_types ( id, type_name )
    `,
    { count: "exact" }
  )

  if (globalFilter) {
    query = query.or(`notes.ilike.%${globalFilter}%`)
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

export async function getVisit(id: string) {
  const t = toast.loading("Fetching Visit details. Please wait.")

  const { data, error } = await supabase
    .from("visits")
    .select(
      `
      *,
      outlets ( id, outlet_code, outlet_name ),
      visit_types ( id, type_name )
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

export async function createVisit(value: VisitStoreType) {
  const t = toast.loading("Scheduling Visit. Please wait.")

  const { data, error } = await supabase.from("visits").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Visit successfully scheduled.")
  return data
}

export async function updateVisit(value: VisitStoreType) {
  const t = toast.loading("Updating Visit. Please wait.")

  const { id, outlets, visit_types, ...updates } = value

  const { data, error } = await supabase
    .from("visits")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Visit successfully updated.")
  return data
}

export async function deleteVisit(id: string) {
  const t = toast.loading("Deleting Visit. Please wait.")

  const { data, error } = await supabase.from("visits").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Visit successfully deleted.")
  return data
}

// --- Lookup Helpers ---
export async function searchOutlets(queryText: string = "", limit = 20) {
  let query = supabase
    .from("outlets")
    .select("id, outlet_code, outlet_name")
    .order("outlet_name", { ascending: true })
    .limit(limit)

  if (queryText.trim()) {
    query = query.or(
      `outlet_code.ilike.%${queryText.trim()}\%,outlet_name.ilike.\%${queryText.trim()}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function searchVisitTypes(queryText: string = "", limit = 20) {
  let query = supabase
    .from("visit_types")
    .select("id, type_name")
    .order("type_name", { ascending: true })
    .limit(limit)

  if (queryText.trim()) {
    query = query.ilike("type_name", `%${queryText.trim()}%`)
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}
