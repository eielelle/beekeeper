import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import { ProductionFormValues } from "../schemas/production.schema"

export type ProductionStoreType = {
  id?: string
  production_date: string
  production_area_id: string
  production_line_id: string
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

export type ProductionFilters = {
  dateFrom?: string
  dateTo?: string
  production_area_id?: number | string
  production_line_id?: number | string
  shift?: "day" | "night" | "all"
  operation_type?: "startup" | "last_prod" | "regular" | "all"
}

type CheckProductionParams = {
  production_date: string
  production_area_id: string
  production_line_id: string
  shift: string
  operation_type: string
}

// --------------------------------------------------------
// RESILIENCE HELPER: Resolve String Codes to Numeric IDs
// --------------------------------------------------------
async function formatItemsForInsert(productionId: string, items: any[]) {
  // Check if any items accidentally passed a string code instead of a numeric DB ID
  const stringSkuCodes = items
    .map((i) => String(i.sku_id))
    .filter((id) => isNaN(Number(id)))

  const skuCodeMap: Record<string, number> = {}

  // If string codes slipped through, dynamically fetch their real numeric IDs
  if (stringSkuCodes.length > 0) {
    const { data } = await supabase
      .from("skus")
      .select("id, sku_code")
      .in("sku_code", stringSkuCodes)

    data?.forEach((sku) => {
      skuCodeMap[sku.sku_code] = sku.id
    })
  }

  // Map everything to strict numerics for PostgreSQL
  return items.map((item) => {
    const strId = String(item.sku_id)
    const resolvedId = isNaN(Number(strId)) ? skuCodeMap[strId] : Number(strId)

    if (!resolvedId) {
      throw new Error(
        `Payload Error: Could not map SKU code "${strId}" to a numeric database ID.`
      )
    }

    return {
      production_id: productionId,
      sku_id: resolvedId,
      qty: item.qty,
    }
  })
}

// --------------------------------------------------------
// FETCH QUERIES
// --------------------------------------------------------
export async function checkExistingProduction({
  production_date,
  production_area_id,
  production_line_id,
  shift,
  operation_type,
}: CheckProductionParams) {
  const { data, error } = await supabase
    .from("productions")
    .select(
      `
      *,
      items:production_items (
        sku_id, 
        qty,
        sku:skus(sku_code)
      )
    `
    )
    .eq("production_date", production_date)
    .eq("production_area_id", production_area_id)
    .eq("production_line_id", production_line_id)
    .eq("shift", shift)
    .eq("operation_type", operation_type)
    .maybeSingle()

  if (error) {
    console.error("Failed to check existing production:", error)
    return null
  }

  return data
}

export async function fetchFilteredProductions(filters: ProductionFilters) {
  let query = supabase
    .from("productions")
    .select(
      `
      *,
      production_items (
        sku_id,
        qty,
        sku:skus(sku_code)
      )
    `
    )
    .order("production_date", { ascending: false })

  if (filters.dateFrom) {
    query = query.gte("production_date", filters.dateFrom)
  }
  if (filters.dateTo) {
    query = query.lte("production_date", filters.dateTo)
  }
  if (filters.production_area_id && filters.production_area_id !== "all") {
    query = query.eq("production_area_id", filters.production_area_id)
  }
  if (filters.production_line_id && filters.production_line_id !== "all") {
    query = query.eq("production_line_id", filters.production_line_id)
  }
  if (filters.shift && filters.shift !== "all") {
    query = query.eq("shift", filters.shift)
  }
  if (filters.operation_type && filters.operation_type !== "all") {
    query = query.eq("operation_type", filters.operation_type)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function getProduction(id: string) {
  const t = toast.loading("Fetching Production. Please wait.")

  const { data, error } = await supabase
    .from("productions")
    .select(
      `
      *,
      items:production_items (
        sku_id, 
        qty,
        sku:skus(sku_code)
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

// --------------------------------------------------------
// CREATE
// --------------------------------------------------------
export async function createProduction(value: ProductionFormValues) {
  const t = toast.loading("Creating Production record. Please wait.")

  // 1. Separate items array from parent fields
  const { items, ...productionData } = value

  // 2. Insert main record
  const { data: production, error: productionError } = await supabase
    .from("productions")
    .insert([productionData])
    .select()
    .single()

  if (productionError) {
    toast.dismiss(t)
    toast.error(`ERR: ${productionError.message}`)
    throw productionError
  }

  try {
    // 3. Auto-resolve IDs and format for DB
    const itemsToInsert = await formatItemsForInsert(production.id, items)

    // 4. Bulk insert child items
    const { error: itemsError } = await supabase
      .from("production_items")
      .insert(itemsToInsert)

    if (itemsError) throw itemsError

    toast.dismiss(t)
    toast.success("Production record successfully created.")
    return production
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: Failed to save items - ${error.message}`)
    throw error
  }
}

// --------------------------------------------------------
// UPDATE
// --------------------------------------------------------
export type UpdateProductionPayload = ProductionFormValues & { id: string }

export async function updateProduction(value: UpdateProductionPayload) {
  const t = toast.loading("Updating Production record. Please wait.")

  // 1. Separate ID and items from the update payload
  const { id, items, ...updates } = value

  // 2. Update main record
  const { data: production, error: updateError } = await supabase
    .from("productions")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (updateError) {
    toast.dismiss(t)
    toast.error(`ERR: ${updateError.message}`)
    throw updateError
  }

  try {
    // 3. Delete existing items to prepare for fresh insert
    await supabase.from("production_items").delete().eq("production_id", id)

    // 4. Auto-resolve IDs and format for DB
    const itemsToInsert = await formatItemsForInsert(id, items)

    // 5. Bulk insert updated items
    const { error: itemsError } = await supabase
      .from("production_items")
      .insert(itemsToInsert)

    if (itemsError) throw itemsError

    toast.dismiss(t)
    toast.success("Production record successfully updated.")
    return production
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: Failed to update items - ${error.message}`)
    throw error
  }
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
