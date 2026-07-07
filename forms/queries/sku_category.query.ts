import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SkuCategoryStoreType = {
  id?: string
  category_name: string
  category_description: string
  organization_id?: number
  created_at?: string
}

export type FetchSkuCategoriesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSkuCategories({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchSkuCategoriesParams) {
  const t = toast.loading("Fetching SKU Categories. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("sku_categories").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on category_name)
  if (globalFilter) {
    query = query.ilike("category_name", `%${globalFilter}%`)
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

export async function getSkuCategory(id: string) {
  const t = toast.loading("Fetching SKU Category. Please wait.")

  const { data, error } = await supabase
    .from("sku_categories")
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

export async function createSkuCategory(value: SkuCategoryStoreType) {
  const t = toast.loading("Creating SKU Category. Please wait.")

  const { data, error } = await supabase.from("sku_categories").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU Category successfully created.")

  return data
}

export async function updateSkuCategory(value: SkuCategoryStoreType) {
  const t = toast.loading("Updating SKU Category. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("sku_categories")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU Category successfully updated.")

  return data
}

export async function deleteSkuCategory(id: string) {
  const t = toast.loading("Deleting SKU Category. Please wait.")

  const { data, error } = await supabase
    .from("sku_categories")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU Category successfully deleted.")
  return data
}
