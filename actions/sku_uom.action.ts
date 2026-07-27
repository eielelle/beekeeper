"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchSkuUomsParams,
  SkuUomStoreType,
} from "@/forms/queries/sku_uom.query"

// ==========================================
// 1. FETCH ALL SKU UOMs
// ==========================================
export async function fetchSkuUomsAction(params: FetchSkuUomsParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sku_uoms")) {
    throw new Error(
      "Forbidden: You do not have permission to view Units of Measurement."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("sku_uoms").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.or(
      `uom_code.ilike.%${params.globalFilter}%,uom_name.ilike.%${params.globalFilter}%`
    )
  }

  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE SKU UOM
// ==========================================
export async function getSkuUomAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sku_uoms")) {
    throw new Error("Forbidden: You cannot view this Unit of Measurement.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_uoms")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE SKU UOM
// ==========================================
export async function createSkuUomAction(value: SkuUomStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "sku_uoms")) {
    throw new Error(
      "Forbidden: You do not have permission to create Units of Measurement."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_uoms")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE SKU UOM
// ==========================================
export async function updateSkuUomAction(value: SkuUomStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "sku_uoms")) {
    throw new Error(
      "Forbidden: You do not have permission to update Units of Measurement."
    )
  }

  const { id, ...updates } = value
  if (!id) throw new Error("UoM ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_uoms")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE SKU UOM
// ==========================================
export async function deleteSkuUomAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "sku_uoms")) {
    throw new Error(
      "Forbidden: You do not have permission to delete Units of Measurement."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_uoms")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
