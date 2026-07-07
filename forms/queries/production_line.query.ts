import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionLineStoreType = {
  id?: string
  line_code: string
  line_name: string
  line_description: string
  organization_id?: number
  created_at?: string
}

export type FetchProductionLinesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchProductionLines({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchProductionLinesParams) {
  const t = toast.loading("Fetching Production Lines. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("production_lines").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on line_name)
  if (globalFilter) {
    query = query.ilike("line_name", `%${globalFilter}%`)
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

export async function getProductionLine(id: string) {
  const t = toast.loading("Fetching Production Line. Please wait.")

  const { data, error } = await supabase
    .from("production_lines")
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

export async function createProductionLine(value: ProductionLineStoreType) {
  const t = toast.loading("Creating Production Line. Please wait.")

  const { data, error } = await supabase
    .from("production_lines")
    .insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Line successfully created.")

  return data
}

export async function updateProductionLine(value: ProductionLineStoreType) {
  const t = toast.loading("Updating Production Line. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("production_lines")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Line successfully updated.")

  return data
}

export async function deleteProductionLine(id: string) {
  const t = toast.loading("Deleting Production Line. Please wait.")

  const { data, error } = await supabase
    .from("production_lines")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Line successfully deleted.")
  return data
}
