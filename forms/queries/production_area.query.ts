import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionAreaStoreType = {
  id?: string
  area_code: string
  area_name: string
  area_description?: string
  org_id?: number
  created_at?: string
}

export type FetchProductionAreasParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchProductionAreas({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchProductionAreasParams) {
  const t = toast.loading("Fetching Production Areas. Please wait.")

  let query = supabase.from("production_areas").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.or(
      `area_code.ilike.%${globalFilter}%,area_name.ilike.%${globalFilter}%`
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

export async function getProductionArea(id: string) {
  const t = toast.loading("Fetching Production Area. Please wait.")

  const { data, error } = await supabase
    .from("production_areas")
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

export async function createProductionArea(value: ProductionAreaStoreType) {
  const t = toast.loading("Creating Production Area. Please wait.")

  const { data, error } = await supabase
    .from("production_areas")
    .insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Area successfully created.")

  return data
}

export async function updateProductionArea(value: ProductionAreaStoreType) {
  const t = toast.loading("Updating Production Area. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("production_areas")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Area successfully updated.")

  return data
}

export async function deleteProductionArea(id: string) {
  const t = toast.loading("Deleting Production Area. Please wait.")

  const { data, error } = await supabase
    .from("production_areas")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Area successfully deleted.")
  return data
}

/**
 * Lightweight search function without loading toasts, designed for Combobox inputs.
 */
export async function searchProductionAreas(searchQuery: string = "") {
  let query = supabase
    .from("production_areas")
    .select("id, area_code, area_name")
    .order("area_name", { ascending: true })
    .limit(20)

  if (searchQuery.trim()) {
    query = query.or(
      `area_code.ilike.%${searchQuery}%,area_name.ilike.%${searchQuery}%`
    )
  }

  const { data, error } = await query

  if (error) {
    console.error("Error searching production areas:", error)
    return []
  }

  return data || []
}
