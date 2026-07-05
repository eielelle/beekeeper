import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SkuUomStoreType = {
  id?: string
  uom: string
  organization_id?: number
  created_at?: string
}

export async function fetchSkuUoms() {
  const t = toast.loading("Fetching Units of Measure. Please wait.")

  const { data, error } = await supabase.from("sku_uoms").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
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
