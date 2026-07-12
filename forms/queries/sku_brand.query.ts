import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SkuBrandStoreType = {
  id?: string
  brand_name: string
  org_id?: number
  created_at?: string
}

export type FetchSkuBrandsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSkuBrands({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchSkuBrandsParams) {
  const t = toast.loading("Fetching SKU Brands. Please wait.")

  let query = supabase.from("sku_brands").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.ilike("brand_name", `%${globalFilter}%`)
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

export async function getSkuBrand(id: string) {
  const t = toast.loading("Fetching SKU Brand. Please wait.")

  const { data, error } = await supabase
    .from("sku_brands")
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

export async function createSkuBrand(value: SkuBrandStoreType) {
  const t = toast.loading("Creating SKU Brand. Please wait.")

  const { data, error } = await supabase.from("sku_brands").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU Brand successfully created.")

  return data
}

export async function updateSkuBrand(value: SkuBrandStoreType) {
  const t = toast.loading("Updating SKU Brand. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("sku_brands")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU Brand successfully updated.")

  return data
}

export async function deleteSkuBrand(id: string) {
  const t = toast.loading("Deleting SKU Brand. Please wait.")

  const { data, error } = await supabase
    .from("sku_brands")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU Brand successfully deleted.")
  return data
}
