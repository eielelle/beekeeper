import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SalesGroupStoreType = {
  id?: string
  name: string
  org_id?: number
  created_at?: string
}

export type FetchSalesGroupsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSalesGroups({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchSalesGroupsParams) {
  const t = toast.loading("Fetching Sales Groups. Please wait.")

  let query = supabase.from("sales_groups").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.ilike("name", `%${globalFilter}%`)
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getSalesGroup(id: string) {
  const t = toast.loading("Fetching Sales Group. Please wait.")

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

export async function createSalesGroup(value: SalesGroupStoreType) {
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

export async function updateSalesGroup(value: SalesGroupStoreType) {
  const t = toast.loading("Updating Sales Group. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("sales_groups")
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

export async function deleteSalesGroup(id: string) {
  const t = toast.loading("Deleting Sales Group. Please wait.")

  const { data, error } = await supabase
    .from("sales_groups")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Sales Group successfully deleted.")
  return data
}

export async function searchSalesGroupOptions(searchTerm: string) {
  let query = supabase.from("sales_groups").select("id, group_name")

  if (searchTerm) {
    query = query.ilike("outlet_name", `%${searchTerm}%`)
  }

  const { data } = await query.limit(20) // Limit results for performance

  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.group_name,
  }))
}
