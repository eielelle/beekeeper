import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type LocationStoreType = {
  id?: string
  name: string
  address: string
  org_id?: number
  created_at?: string
}

export type FetchLocationsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchLocations({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchLocationsParams) {
  const t = toast.loading("Fetching Locations. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("locations").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on name or address)
  if (globalFilter) {
    query = query.or(
      `name.ilike.%${globalFilter}%,address.ilike.%${globalFilter}%`
    )
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

export async function getLocation(id: string) {
  const t = toast.loading("Fetching Location. Please wait.")

  const { data, error } = await supabase
    .from("locations")
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

export async function createLocation(value: LocationStoreType) {
  const t = toast.loading("Creating Location. Please wait.")

  const { data, error } = await supabase.from("locations").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Location successfully created.")

  return data
}

export async function updateLocation(value: LocationStoreType) {
  const t = toast.loading("Updating Location. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("locations")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Location successfully updated.")

  return data
}

export async function deleteLocation(id: string) {
  const t = toast.loading("Deleting Location. Please wait.")

  const { data, error } = await supabase.from("locations").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Location successfully deleted.")
  return data
}
