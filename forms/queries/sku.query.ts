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
  organization_id?: number
  created_at?: string
}

export async function fetchSkus() {
  const t = toast.loading("Fetching SKUs. Please wait.")

  const { data, error } = await supabase.from("skus").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
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
