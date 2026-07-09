import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type BranchStoreType = {
  id?: string
  name: string
  code: string
  org_id?: number
  created_at?: string
}

export type FetchBranchesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchBranches({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchBranchesParams) {
  const t = toast.loading("Fetching Branches. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("branches").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on name or code)
  if (globalFilter) {
    query = query.or(
      `name.ilike.%${globalFilter}%,code.ilike.%${globalFilter}%`
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

export async function getBranch(id: string) {
  const t = toast.loading("Fetching Branch. Please wait.")

  const { data, error } = await supabase
    .from("branches")
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

export async function createBranch(value: BranchStoreType) {
  const t = toast.loading("Creating Branch. Please wait.")

  const { data, error } = await supabase.from("branches").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Branch successfully created.")

  return data
}

export async function updateBranch(value: BranchStoreType) {
  const t = toast.loading("Updating Branch. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("branches")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Branch successfully updated.")

  return data
}

export async function deleteBranch(id: string) {
  const t = toast.loading("Deleting Branch. Please wait.")

  const { data, error } = await supabase.from("branches").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Branch successfully deleted.")
  return data
}
