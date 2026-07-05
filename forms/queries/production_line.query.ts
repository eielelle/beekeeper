import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionLineStoreType = {
  id?: string
  line_name: string
  line_description: string
  organization_id?: number
  created_at?: string
}

export async function fetchProductionLines() {
  const t = toast.loading("Fetching Production Lines. Please wait.")

  const { data, error } = await supabase.from("production_lines").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function getProductionLine(id: string) {
  const t = toast.loading("Fetching Production Line. Please wait.")

  const { data, error } = await supabase
    .from("production_lines")
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

export async function createProductionLine(value: ProductionLineStoreType) {
  const t = toast.loading("Creating Production Line. Please wait.")

  const { data, error } = await supabase
    .from("production_lines")
    .insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Line successfully created.")

  return data
}

export async function updateProductionLine(value: ProductionLineStoreType) {
  const t = toast.loading("Updating Production Line. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("production_lines")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production Line successfully updated.")

  return data
}
