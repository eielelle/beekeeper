import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type VisitTypeStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  type_name: string
  description?: string
}

export type FetchVisitTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchVisitTypes({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchVisitTypesParams) {
  const t = toast.loading("Fetching Visit Types. Please wait.")

  let query = supabase.from("visit_types").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.or(
      `type_name.ilike.%${globalFilter}%,description.ilike.%${globalFilter}%`
    )
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
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

export async function getVisitType(id: string) {
  const t = toast.loading("Fetching Visit Type. Please wait.")

  const { data, error } = await supabase
    .from("visit_types")
    .select("*")
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function createVisitType(value: VisitTypeStoreType) {
  const t = toast.loading("Creating Visit Type. Please wait.")

  const { data, error } = await supabase.from("visit_types").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Visit Type successfully created.")

  return data
}

export async function updateVisitType(value: VisitTypeStoreType) {
  const t = toast.loading("Updating Visit Type. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("visit_types")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Visit Type successfully updated.")

  return data
}

export async function deleteVisitType(id: string) {
  const t = toast.loading("Deleting Visit Type. Please wait.")

  const { data, error } = await supabase
    .from("visit_types")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Visit Type successfully deleted.")
  return data
}

// --- Helper for Comboboxes in other forms ---
export async function searchVisitTypeOptions(
  queryText: string = "",
  limit = 20
) {
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
