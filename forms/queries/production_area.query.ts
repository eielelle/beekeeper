import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionAreaStoreType = {
  id?: string
  area_name: string
  area_code: string
  organization_id?: number
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

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("production_areas").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on area_name)
  if (globalFilter) {
    query = query.ilike("area_name", `%${globalFilter}%`)
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
