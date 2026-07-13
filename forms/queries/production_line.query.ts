import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionLineStoreType = {
  id?: string
  line_name: string
  line_description?: string
  org_id?: number
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

  let query = supabase.from("production_lines").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.or(
      `line_name.ilike.%${globalFilter}%,line_description.ilike.%${globalFilter}%`
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

/**
 * Lightweight search function without loading toasts, designed for Select/Combobox inputs.
 */
export async function searchProductionLines(searchQuery: string = "") {
  let query = supabase
    .from("production_lines")
    .select("id, line_name")
    .order("line_name", { ascending: true })
    .limit(20)

  if (searchQuery.trim()) {
    query = query.ilike("line_name", `%${searchQuery}%`)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error searching production lines:", error)
    return []
  }

  return data || []
}
