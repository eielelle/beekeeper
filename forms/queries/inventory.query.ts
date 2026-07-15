import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { searchSkus } from "./sku.query" // Assuming this exists based on your prompt

export type InventoryStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  outlet_id: number | string
  sku_id: number | string
  qty: number
  expiration_date?: string | null
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

export type FetchInventoriesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

// Bulk insert payload type
export type CreateInventoryPayload = {
  outlet_id: number
  items: {
    sku_id: number
    qty: number
    expiration_date?: string | null
  }[]
}

export async function fetchInventories({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchInventoriesParams) {
  const t = toast.loading("Fetching Inventories. Please wait.")

  let query = supabase.from("inventories").select(
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

export async function getInventory(id: string) {
  const t = toast.loading("Fetching Inventory. Please wait.")

  const { data, error } = await supabase
    .from("inventories")
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
export async function createInventories(payload: CreateInventoryPayload) {
  const t = toast.loading("Adding items to inventory. Please wait.")

  const insertData = payload.items.map((item) => ({
    outlet_id: payload.outlet_id,
    sku_id: item.sku_id,
    qty: item.qty,
    expiration_date: item.expiration_date || null,
  }))

  const { data, error } = await supabase.from("inventories").insert(insertData)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success(`Successfully added ${insertData.length} items to inventory.`)
  return data
}

// Single Update: Edit mode only edits one specific inventory row
export async function updateInventory(
  id: string,
  payload: CreateInventoryPayload
) {
  const t = toast.loading("Updating Inventory. Please wait.")

  const item = payload.items[0] // Edit mode only passes one item
  const updates = {
    outlet_id: payload.outlet_id,
    sku_id: item.sku_id,
    qty: item.qty,
    expiration_date: item.expiration_date || null,
  }

  const { data, error } = await supabase
    .from("inventories")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Inventory successfully updated.")
  return data
}

export async function deleteInventory(id: string) {
  const t = toast.loading("Deleting Inventory. Please wait.")
  const { data, error } = await supabase
    .from("inventories")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Inventory successfully deleted.")
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

// --- Fetch Current Stock by Outlet ---
export async function fetchInventoryByOutlet(outletId: number) {
  if (!outletId) return []

  const { data, error } = await supabase
    .from("inventories")
    .select(
      `
      id,
      qty,
      expiration_date,
      skus ( id, sku_code, item_name )
    `
    )
    .eq("outlet_id", outletId)
    .order("created_at", { ascending: false }) // Show newest entries first

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data || []
}
