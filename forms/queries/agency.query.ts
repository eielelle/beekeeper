import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type AgencyStoreType = {
  id?: string
  agency_name: string
  agency_description: string
  organization_id?: string
  created_at?: string
}

export type FetchAgenciesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchAgencies({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchAgenciesParams) {
  const t = toast.loading("Fetching Agencies. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("agencies").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on agency_name)
  if (globalFilter) {
    query = query.ilike("agency_name", `%${globalFilter}%`)
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

export async function getAgency(id: string) {
  const t = toast.loading("Fetching Agency. Please wait.")

  const { data, error } = await supabase
    .from("agencies")
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

export async function createAgency(value: AgencyStoreType) {
  const t = toast.loading("Creating Agency. Please wait.")

  const { data, error } = await supabase.from("agencies").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Agency successfully created.")

  return data
}

export async function updateAgency(value: AgencyStoreType) {
  const t = toast.loading("Updating Agency. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("agencies")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Agency successfully updated.")

  return data
}

export async function deleteAgency(id: string) {
  const t = toast.loading("Deleting Agency. Please wait.")

  const { data, error } = await supabase.from("agencies").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Agency successfully deleted.")
  return data
}
