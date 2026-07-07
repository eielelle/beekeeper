import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SkuUomStoreType = {
  id?: string
  uom: string
  organization_id?: number
  created_at?: string
}

export type FetchSkuUomsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSkuUoms({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchSkuUomsParams) {
  const t = toast.loading("Fetching Units of Measure. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("sku_uoms").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on uom text field)
  if (globalFilter) {
    query = query.ilike("uom", `%${globalFilter}%`)
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

export async function getSkuUom(id: string) {
  const t = toast.loading("Fetching Unit of Measure. Please wait.")

  const { data, error } = await supabase
    .from("sku_uoms")
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

export async function createSkuUom(value: SkuUomStoreType) {
  const t = toast.loading("Creating Unit of Measure. Please wait.")

  const { data, error } = await supabase.from("sku_uoms").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Unit of Measure successfully created.")

  return data
}

export async function updateSkuUom(value: SkuUomStoreType) {
  const t = toast.loading("Updating Unit of Measure. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("sku_uoms")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Unit of Measure successfully updated.")

  return data
}

export async function deleteSkuUom(id: string) {
  const t = toast.loading("Deleting Unit of Measure. Please wait.")

  const { data, error } = await supabase.from("sku_uoms").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Unit of Measure successfully deleted.")
  return data
}
