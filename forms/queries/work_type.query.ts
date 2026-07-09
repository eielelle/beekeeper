import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type WorkTypeStoreType = {
  id?: string
  name: string
  org_id?: number
  created_at?: string
}

export type FetchWorkTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchWorkTypes({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchWorkTypesParams) {
  const t = toast.loading("Fetching Work Types. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("work_types").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on name)
  if (globalFilter) {
    query = query.ilike("name", `%${globalFilter}%`)
  }

  // 3. Server-Side Sorting
  if (sorting && sorting.length > 0) {
    const sort = sorting[0] // Handling single column sorting
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    // Default fallback sort
    query = query.order("created_at", { ascending: false })
  }

  // 4. Server-Side Pagination Range Calc
  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  // Return both data and the total exact count needed by the frontend pagination controls
  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getWorkType(id: string) {
  const t = toast.loading("Fetching Work Type. Please wait.")

  const { data, error } = await supabase
    .from("work_types")
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

export async function createWorkType(value: WorkTypeStoreType) {
  const t = toast.loading("Creating Work Type. Please wait.")

  const { data, error } = await supabase.from("work_types").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Work Type successfully created.")

  return data
}

export async function updateWorkType(value: WorkTypeStoreType) {
  const t = toast.loading("Updating Work Type. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("work_types")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Work Type successfully updated.")

  return data
}

export async function deleteWorkType(id: string) {
  const t = toast.loading("Deleting Work Type. Please wait.")

  const { data, error } = await supabase
    .from("work_types")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Work Type successfully deleted.")
  return data
}
