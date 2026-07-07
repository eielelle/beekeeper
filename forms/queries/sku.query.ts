import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SkuStoreType = {
  id?: string
  sku_category_id: string
  sku_uom_id: string
  item_name: string
  item_description: string
  sku_code: string
  barcode: string
  photo_url?: string
  created_at?: string
}

interface FetchSkusParams {
  pageIndex: number
  pageSize: number
  globalFilter?: string
}

export async function fetchSkus({
  pageIndex,
  pageSize,
  globalFilter,
}: FetchSkusParams) {
  // 🔗 Corrected to map precisely to public.sku_categories and public.sku_uoms schema columns
  let query = supabase
    .from("skus")
    .select(
      `
      id,
      sku_category_id,
      sku_uom_id,
      item_name,
      item_description,
      sku_code,
      barcode,
      photo_url,
      created_at,
      sku_categories (category_name),
      sku_uoms (uom)
    `,
      { count: "exact" }
    )
    .order("created_at", { ascending: false })

  // 🎯 Restricting filter matching explicitly to main root columns to block auto-aliased PostgREST exceptions
  if (globalFilter) {
    query = query.or(
      `item_name.ilike.%${globalFilter}%,sku_code.ilike.%${globalFilter}%`
    )
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return {
    data: data || [],
    count: count || 0,
  }
}

export async function getSku(id: string) {
  const t = toast.loading("Fetching SKU. Please wait.")

  const { data, error } = await supabase
    .from("skus")
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

export async function createSku(value: SkuStoreType) {
  const t = toast.loading("Creating SKU. Please wait.")

  const { data, error } = await supabase.from("skus").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU successfully created.")

  return data
}

export async function updateSku(value: SkuStoreType) {
  const t = toast.loading("Updating SKU. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("skus")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU successfully updated.")

  return data
}
