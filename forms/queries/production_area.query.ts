import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionAreaStoreType = {
  id?: string
  area_name: string
  area_code: string
  organization_id?: number
  created_at?: string
}

export async function fetchProductionAreas() {
  const t = toast.loading("Fetching Production Areas. Please wait.")

  const { data, error } = await supabase.from("production_areas").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
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
