import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type OrganizationStoreType = {
  id?: string
  organization_name: string
  company_id?: string
  created_at?: string
}

export type FetchOrganizationsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchOrganizations({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchOrganizationsParams) {
  const t = toast.loading("Fetching Organizations. Please wait.")

  // 1. Base query setup
  let query = supabase.from("organizations").select("*", { count: "exact" }) // { count: "exact" } gets total rows for pagination

  // 2. Server-Side Global Filtering (ILIKE search on organization_name)
  if (globalFilter) {
    query = query.ilike("organization_name", `%${globalFilter}%`)
  }

  // 3. Server-Side Sorting
  if (sorting && sorting.length > 0) {
    const sort = sorting[0] // Handling single column sorting
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    // Default fallback sort
    query = query.order("created_at", { ascending: false })
  }

  // 4. Server-Side Pagination Range Calc
  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  // Return both data and the total exact count needed by the frontend pagination controls
  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getOrganization(id: string) {
  const t = toast.loading("Fetching Organization. Please wait.")

  const { data, error } = await supabase
    .from("organizations")
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

export async function createOrganization(value: OrganizationStoreType) {
  const t = toast.loading("Creating Organization. Please wait.")

  const { data, error } = await supabase.from("organizations").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Organization successfully created.")

  return data
}

export async function updateOrganization(value: OrganizationStoreType) {
  const t = toast.loading("Updating Organization. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Organization successfully updated.")

  return data
}

export async function deleteOrganization(id: string) {
  const t = toast.loading("Deleting Organization. Please wait.")

  const { data, error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Organization successfully deleted.")
  return data
}
