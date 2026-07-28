"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { ProductionFilters } from "@/forms/queries/production.query"

// Types needed for the action
type CheckProductionParams = {
  production_date: string
  production_area_id: string
  production_line_id: string
  shift: string
  operation_type: string
}

// --------------------------------------------------------
// RESILIENCE HELPER (Runs securely on the server)
// --------------------------------------------------------
async function formatItemsForInsert(
  supabase: any,
  productionId: string,
  items: any[]
) {
  const stringSkuCodes = items
    .map((i) => String(i.sku_id))
    .filter((id) => isNaN(Number(id)))
  const skuCodeMap: Record<string, number> = {}

  if (stringSkuCodes.length > 0) {
    const { data } = await supabase
      .from("skus")
      .select("id, sku_code")
      .in("sku_code", stringSkuCodes)
    data?.forEach((sku: any) => {
      skuCodeMap[sku.sku_code] = sku.id
    })
  }

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
// FETCH ACTIONS
// --------------------------------------------------------
export async function checkExistingProductionAction(
  params: CheckProductionParams
) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "productions")) return null

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("productions")
    .select(`*, items:production_items ( sku_id, qty, sku:skus(sku_code) )`)
    .eq("production_date", params.production_date)
    .eq("production_area_id", params.production_area_id)
    .eq("production_line_id", params.production_line_id)
    .eq("shift", params.shift)
    .eq("operation_type", params.operation_type)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export async function fetchFilteredProductionsAction(
  filters: ProductionFilters
) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "productions")) {
    throw new Error(
      "Forbidden: You do not have permission to view productions."
    )
  }

  const supabase = await createClient()
  let query = supabase
    .from("productions")
    .select(`*, production_items ( sku_id, qty, sku:skus(sku_code) )`)
    .order("production_date", { ascending: false })

  if (filters.dateFrom) query = query.gte("production_date", filters.dateFrom)
  if (filters.dateTo) query = query.lte("production_date", filters.dateTo)
  if (filters.production_area_id && filters.production_area_id !== "all")
    query = query.eq("production_area_id", filters.production_area_id)
  if (filters.production_line_id && filters.production_line_id !== "all")
    query = query.eq("production_line_id", filters.production_line_id)
  if (filters.shift && filters.shift !== "all")
    query = query.eq("shift", filters.shift)
  if (filters.operation_type && filters.operation_type !== "all")
    query = query.eq("operation_type", filters.operation_type)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data
}

export async function getProductionAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "productions")) {
    throw new Error("Forbidden: You cannot view this production record.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("productions")
    .select(`*, items:production_items ( sku_id, qty, sku:skus(sku_code) )`)
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// --------------------------------------------------------
// MUTATION ACTIONS
// --------------------------------------------------------
export async function createProductionAction(value: any) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "productions")) {
    throw new Error("Forbidden: You do not have permission to log production.")
  }

  const { items, ...productionData } = value
  const supabase = await createClient()

  // 1. Insert main record
  const { data: production, error: productionError } = await supabase
    .from("productions")
    .insert([productionData])
    .select()
    .single()
  if (productionError) throw new Error(productionError.message)

  // 2. Insert items
  const itemsToInsert = await formatItemsForInsert(
    supabase,
    production.id,
    items
  )
  const { error: itemsError } = await supabase
    .from("production_items")
    .insert(itemsToInsert)
  if (itemsError) throw new Error(`Failed to save items: ${itemsError.message}`)

  return production
}

export async function updateProductionAction(value: any) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "productions")) {
    throw new Error(
      "Forbidden: You do not have permission to update production records."
    )
  }

  const { id, items, ...updates } = value
  if (!id) throw new Error("Production ID is required.")

  const supabase = await createClient()

  // 1. Update main record
  const { data: production, error: updateError } = await supabase
    .from("productions")
    .update(updates)
    .eq("id", id)
    .select()
    .single()
  if (updateError) throw new Error(updateError.message)

  // 2. Refresh items (Delete old, insert new)
  await supabase.from("production_items").delete().eq("production_id", id)
  const itemsToInsert = await formatItemsForInsert(supabase, id, items)
  const { error: itemsError } = await supabase
    .from("production_items")
    .insert(itemsToInsert)

  if (itemsError)
    throw new Error(`Failed to update items: ${itemsError.message}`)

  return production
}

export async function deleteProductionAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "productions")) {
    throw new Error(
      "Forbidden: You do not have permission to delete production records."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("productions")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
