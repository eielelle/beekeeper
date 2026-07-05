import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type OutletStoreType = {
  id?: string
  outlet_code: string
  outlet_name: string
  outlet_description: string
  phone: string
  email: string
  is_approved: boolean
  is_distributor: boolean
  distributor_id: string
  sales_group_id: string
  address: string
  region: string
  city: string
  province: string
  country: string
  barangay: string
  zip_code: string
  outlet_type_id: string
  organization_id?: number
  created_at?: string
}

export async function fetchOutlets() {
  const t = toast.loading("Fetching Outlets. Please wait.")

  const { data, error } = await supabase.from("outlets").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function getOutlet(id: string) {
  const t = toast.loading("Fetching Outlet. Please wait.")

  const { data, error } = await supabase
    .from("outlets")
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

export async function createOutlet(value: OutletStoreType) {
  const t = toast.loading("Creating Outlet. Please wait.")

  const { data, error } = await supabase.from("outlets").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Outlet successfully created.")

  return data
}

export async function updateOutlet(value: OutletStoreType) {
  const t = toast.loading("Updating Outlet. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("outlets")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Outlet successfully updated.")

  return data
}
