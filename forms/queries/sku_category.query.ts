import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SkuCategoryStoreType = {
  id?: string
  category_name: string
  category_description: string
  organization_id?: number
  created_at?: string
}

export async function fetchSkuCategories() {
  const t = toast.loading("Fetching SKU Categories. Please wait.")

  const { data, error } = await supabase.from("sku_categories").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
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
