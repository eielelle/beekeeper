import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SalesGroupType = {
  id?: string
  group_name: string
  group_description: string
  organization_id?: number
  created_at?: string
}

export async function fetchSalesGroups() {
  const t = toast.loading("Fetching Sales Groups. Please wait.")

  const { data, error } = await supabase.from("sales_groups").select("*")

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function getSalesGroup(id: string) {
  const t = toast.loading("Fetching Sales Groups. Please wait.")

  const { data, error } = await supabase
    .from("sales_groups")
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

export async function createSalesGroup(value: SalesGroupType) {
  const t = toast.loading("Creating Sales Group. Please wait.")

  const { data, error } = await supabase.from("sales_groups").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Sales Group successfully created.")

  return data
}

export async function updateSalesGroup(value: SalesGroupType) {
  const t = toast.loading("Updating Sales Group. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("sales_group")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Sales Group successfully updated.")

  return data
}
