import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type PositionStoreType = {
  id?: string
  title: string
  code?: string
  org_id?: number
  created_at?: string
}

export type FetchPositionsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchPositions({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchPositionsParams) {
  const t = toast.loading("Fetching Positions. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("positions").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on title or code)
  if (globalFilter) {
    query = query.or(
      `title.ilike.%${globalFilter}%,code.ilike.%${globalFilter}%`
    )
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

export async function getPosition(id: string) {
  const t = toast.loading("Fetching Position. Please wait.")

  const { data, error } = await supabase
    .from("positions")
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

export async function createPosition(value: PositionStoreType) {
  const t = toast.loading("Creating Position. Please wait.")

  const { data, error } = await supabase.from("positions").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Position successfully created.")

  return data
}

export async function updatePosition(value: PositionStoreType) {
  const t = toast.loading("Updating Position. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("positions")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Position successfully updated.")

  return data
}

export async function deletePosition(id: string) {
  const t = toast.loading("Deleting Position. Please wait.")

  const { data, error } = await supabase.from("positions").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Position successfully deleted.")
  return data
}
