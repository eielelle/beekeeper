import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ShiftTypeStoreType = {
  id?: string
  name: string
  start_time: string
  end_time: string
  org_id?: number
  created_at?: string
}

export type FetchShiftTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchShiftTypes({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchShiftTypesParams) {
  const t = toast.loading("Fetching Shift Types. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("shift_types").select("*", { count: "exact" })

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

export async function getShiftType(id: string) {
  const t = toast.loading("Fetching Shift Type. Please wait.")

  const { data, error } = await supabase
    .from("shift_types")
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

export async function createShiftType(value: ShiftTypeStoreType) {
  const t = toast.loading("Creating Shift Type. Please wait.")

  const { data, error } = await supabase.from("shift_types").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Shift Type successfully created.")

  return data
}

export async function updateShiftType(value: ShiftTypeStoreType) {
  const t = toast.loading("Updating Shift Type. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("shift_types")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Shift Type successfully updated.")

  return data
}

export async function deleteShiftType(id: string) {
  const t = toast.loading("Deleting Shift Type. Please wait.")

  const { data, error } = await supabase
    .from("shift_types")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Shift Type successfully deleted.")
  return data
}
