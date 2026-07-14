import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type EmploymentStatusType = {
  id?: string
  name: string
  org_id?: number
  created_at?: string
}

export type FetchEmploymentStatusesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchEmploymentStatuses({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchEmploymentStatusesParams) {
  const t = toast.loading("Fetching Employment Statuses. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase
    .from("employment_statuses")
    .select("*", { count: "exact" })

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

export async function getEmploymentStatus(id: string) {
  const t = toast.loading("Fetching Employment Status. Please wait.")

  const { data, error } = await supabase
    .from("employment_statuses")
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

export async function createEmploymentStatus(value: EmploymentStatusType) {
  const t = toast.loading("Creating Employment Status. Please wait.")

  const { data, error } = await supabase
    .from("employment_statuses")
    .insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Employment Status successfully created.")

  return data
}

export async function updateEmploymentStatus(value: EmploymentStatusType) {
  const t = toast.loading("Updating Employment Status. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("employment_statuses")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Employment Status successfully updated.")

  return data
}

export async function deleteEmploymentStatus(id: string) {
  const t = toast.loading("Deleting Employment Status. Please wait.")

  const { data, error } = await supabase
    .from("employment_statuses")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Employment Status successfully deleted.")
  return data
}
