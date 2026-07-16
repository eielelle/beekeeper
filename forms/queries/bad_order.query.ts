import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type BadOrderStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  outlet_id: number | string
  type: "for_disposal" | "return_to_wh"
  notes?: string | null

  outlets?: {
    id: number | string
    outlet_code: string
    outlet_name: string
  } | null
  bad_orders_items?: {
    id: string
    sku_id: number | string
    qty: number
    expiration_date?: string | null
    reason: string
    skus?: {
      sku_code: string
      item_name: string
    }
  }[]
}

export type FetchBadOrdersParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export type CreateBadOrderPayload = {
  outlet_id: number
  type: "for_disposal" | "return_to_wh"
  notes?: string | null
  items: {
    sku_id: number
    qty: number
    expiration_date?: string | null
    reason: string
  }[]
}

export async function fetchBadOrders({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchBadOrdersParams) {
  const t = toast.loading("Fetching Bad Orders. Please wait.")

  let query = supabase.from("bad_orders").select(
    `
      *,
      outlets ( id, outlet_code, outlet_name ),
      bad_orders_items ( id )
    `,
    { count: "exact" }
  )

  if (globalFilter) {
    query = query.or(
      `notes.ilike.%${globalFilter}%,type.ilike.%${globalFilter}%`
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

export async function getBadOrder(id: string) {
  const t = toast.loading("Fetching Bad Order details. Please wait.")

  const { data, error } = await supabase
    .from("bad_orders")
    .select(
      `
      *,
      outlets ( id, outlet_code, outlet_name ),
      bad_orders_items (
        id,
        sku_id,
        qty,
        expiration_date,
        reason,
        skus ( sku_code, item_name )
      )
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

export async function createBadOrder(payload: CreateBadOrderPayload) {
  const t = toast.loading("Creating Bad Order. Please wait.")

  const { items, ...orderData } = payload

  // 1. Insert master record
  const { data: order, error: orderError } = await supabase
    .from("bad_orders")
    .insert([orderData])
    .select()
    .single()

  if (orderError) {
    toast.dismiss(t)
    toast.error(`ERR: ${orderError.message}`)
    throw orderError
  }

  // 2. Insert items
  if (items && items.length > 0) {
    const insertItems = items.map((item) => ({
      bad_order_id: order.id,
      ...item,
    }))

    const { error: itemsError } = await supabase
      .from("bad_orders_items")
      .insert(insertItems)

    if (itemsError) {
      toast.dismiss(t)
      toast.error(`ERR: Failed to add items - ${itemsError.message}`)
      throw itemsError
    }
  }

  toast.dismiss(t)
  toast.success("Bad Order successfully created.")
  return order
}

export async function updateBadOrder(
  id: string,
  payload: CreateBadOrderPayload
) {
  const t = toast.loading("Updating Bad Order. Please wait.")

  const { items, ...orderUpdates } = payload

  // 1. Update master record
  const { error: orderError } = await supabase
    .from("bad_orders")
    .update(orderUpdates)
    .eq("id", id)

  if (orderError) {
    toast.dismiss(t)
    toast.error(`ERR: ${orderError.message}`)
    throw orderError
  }

  // 2. Delete old items
  const { error: deleteError } = await supabase
    .from("bad_orders_items")
    .delete()
    .eq("bad_order_id", id)

  if (deleteError) {
    toast.dismiss(t)
    toast.error(`ERR: Failed to clean up old items.`)
    throw deleteError
  }

  // 3. Insert new items
  if (items && items.length > 0) {
    const insertItems = items.map((item) => ({
      bad_order_id: id,
      ...item,
    }))

    const { error: itemsError } = await supabase
      .from("bad_orders_items")
      .insert(insertItems)

    if (itemsError) {
      toast.dismiss(t)
      toast.error(`ERR: Failed to re-add items.`)
      throw itemsError
    }
  }

  toast.dismiss(t)
  toast.success("Bad Order successfully updated.")
  return true
}

export async function deleteBadOrder(id: string) {
  const t = toast.loading("Deleting Bad Order. Please wait.")

  const { data, error } = await supabase
    .from("bad_orders")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Bad Order successfully deleted.")
  return data
}

// --- Lookups ---
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

export async function searchSkus(queryText: string = "", limit = 20) {
  let query = supabase
    .from("skus")
    .select("id, sku_code, item_name")
    .order("item_name", { ascending: true })
    .limit(limit)

  if (queryText.trim()) {
    query = query.or(
      `sku_code.ilike.%${queryText.trim()}%,item_name.ilike.%${queryText.trim()}%`
    )
  }

  const { data, error } = await query
  if (error) throw error
  return data || []
}
