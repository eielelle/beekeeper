import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type SkuUomStoreType = {
  id?: string
  uom_code: string
  uom_name: string
  org_id?: number
  created_at?: string
}

export type FetchSkuUomsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSkuUoms({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchSkuUomsParams) {
  const t = toast.loading("Fetching Units of Measurement. Please wait.")

  let query = supabase.from("sku_uoms").select("*", { count: "exact" })

  if (globalFilter) {
    query = query.or(
      `uom_code.ilike.%${globalFilter}%,uom_name.ilike.%${globalFilter}%`
    )
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

export async function getSkuUom(id: string) {
  const t = toast.loading("Fetching Unit of Measurement. Please wait.")

  const { data, error } = await supabase
    .from("sku_uoms")
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

export async function createSkuUom(value: SkuUomStoreType) {
  const t = toast.loading("Creating Unit of Measurement. Please wait.")

  const { data, error } = await supabase.from("sku_uoms").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Unit of Measurement successfully created.")

  return data
}

export async function updateSkuUom(value: SkuUomStoreType) {
  const t = toast.loading("Updating Unit of Measurement. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("sku_uoms")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Unit of Measurement successfully updated.")

  return data
}

export async function deleteSkuUom(id: string) {
  const t = toast.loading("Deleting Unit of Measurement. Please wait.")

  const { data, error } = await supabase.from("sku_uoms").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Unit of Measurement successfully deleted.")
  return data
}
