import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { searchSkus } from "./sku.query"

export type SttStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  outlet_id: number | string
  sku_id: number | string
  qty: number
  created_by?: number | string | null
  // Joined relations
  skus?: {
    id: number | string
    sku_code: string
    item_name: string
  } | null
  outlets?: {
    id: number | string
    outlet_code: string
    outlet_name: string
  } | null
}

export type FetchSttsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

// Bulk insert payload type
export type CreateSttPayload = {
  outlet_id: number
  items: {
    sku_id: number
    qty: number
  }[]
}

export async function fetchStts({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchSttsParams) {
  const t = toast.loading("Fetching STT records. Please wait.")

  let query = supabase.from("stt").select(
    `
      *,
      skus ( id, sku_code, item_name ),
      outlets ( id, outlet_code, outlet_name )
    `,
    { count: "exact" }
  )

  if (globalFilter) {
    query = query.or(`id.eq.${globalFilter}`)
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

export async function getStt(id: string) {
  const t = toast.loading("Fetching STT record. Please wait.")

  const { data, error } = await supabase
    .from("stt")
    .select(
      `
      *,
      skus ( id, sku_code, item_name ),
      outlets ( id, outlet_code, outlet_name )
    `
    )
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

// Cart System: Bulk insert multiple SKUs for one Outlet
export async function createStts(payload: CreateSttPayload) {
  const t = toast.loading("Adding items to STT. Please wait.")

  const insertData = payload.items.map((item) => ({
    outlet_id: payload.outlet_id,
    sku_id: item.sku_id,
    qty: item.qty,
  }))

  const { data, error } = await supabase.from("stt").insert(insertData)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success(`Successfully added ${insertData.length} items to STT.`)
  return data
}

// Single Update: Edit mode only edits one specific row
export async function updateStt(id: string, payload: CreateSttPayload) {
  const t = toast.loading("Updating STT record. Please wait.")

  const item = payload.items[0] // Edit mode only passes one item
  const updates = {
    outlet_id: payload.outlet_id,
    sku_id: item.sku_id,
    qty: item.qty,
  }

  const { data, error } = await supabase
    .from("stt")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("STT successfully updated.")
  return data
}

export async function deleteStt(id: string) {
  const t = toast.loading("Deleting STT record. Please wait.")
  const { data, error } = await supabase.from("stt").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("STT successfully deleted.")
  return data
}

// --- Lookup Helpers ---
export async function searchOutlets(queryText: string = "", limit = 20) {
  let query = supabase
    .from("outlets")
    .select("id, outlet_code, outlet_name")
    .order("outlet_name", { ascending: true })
    .limit(limit)

  if (queryText.trim()) {
    query = query.or(
      `outlet_code.ilike.%${queryText.trim()}%,outlet_name.ilike.%${queryText.trim()}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}

// --- Fetch Current STT items by Outlet ---
export async function fetchSttByOutlet(outletId: number) {
  if (!outletId) return []

  const { data, error } = await supabase
    .from("stt")
    .select(
      `
      id,
      qty,
      skus ( id, sku_code, item_name )
    `
    )
    .eq("outlet_id", outletId)
    .order("created_at", { ascending: false })

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data || []
}
