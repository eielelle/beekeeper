import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type OutletType = {
  id?: string
  type_name: string
  type_description: string
  organization_id?: number
  created_at?: string
}

export async function fetchOutletTypes() {
  const t = toast.loading("Fetching Outlet Types. Please wait.")

  const { data, error } = await supabase.from("outlet_types").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function getOutletType(id: string) {
  const t = toast.loading("Fetching Outlet Types. Please wait.")

  const { data, error } = await supabase
    .from("outlet_types")
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

export async function createOutletType(value: OutletType) {
  const t = toast.loading("Creating Outlet Type. Please wait.")

  const { data, error } = await supabase.from("outlet_types").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Outlet Type successfully created.")

  return data
}

export async function updateOutletType(value: OutletType) {
  const t = toast.loading("Updating Outlet Type. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("outlet_types")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Outlet Type successfully updated.")

  return data
}
