import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionStoreType = {
  id?: string
  production_date: string
  production_area: string
  production_line: string
  shift: "day" | "night"
  operation_type: "startup" | "last_prod" | "regular"
  created_at?: string
}

export type FetchProductionsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchProductions({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchProductionsParams) {
  const t = toast.loading("Fetching Productions. Please wait.")

  let query = supabase.from("productions").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.or(
      `production_area.ilike.%${globalFilter}%,production_line.ilike.%${globalFilter}%`
    )
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("production_date", { ascending: false })
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

export async function getProduction(id: string) {
  const t = toast.loading("Fetching Production. Please wait.")

  const { data, error } = await supabase
    .from("productions")
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

export async function createProduction(value: ProductionStoreType) {
  const t = toast.loading("Creating Production record. Please wait.")

  const { data, error } = await supabase.from("productions").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production record successfully created.")
  return data
}

export async function updateProduction(value: ProductionStoreType) {
  const t = toast.loading("Updating Production record. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("productions")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production record successfully updated.")
  return data
}

export async function deleteProduction(id: string) {
  const t = toast.loading("Deleting Production record. Please wait.")

  const { data, error } = await supabase
    .from("productions")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Production record successfully deleted.")
  return data
}
