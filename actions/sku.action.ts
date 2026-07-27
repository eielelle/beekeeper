"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchSkusParams,
  SkuFormValues,
  SkuStoreType,
} from "@/forms/queries/sku.query"

// ==========================================
// 1. FETCH ALL SKUS
// ==========================================
export async function fetchSkusAction(params: FetchSkusParams) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "skus")) {
    throw new Error("Forbidden: You do not have permission to view SKUs.")
  }

  const supabase = await createClient()
  let query = supabase.from("skus").select(
    `
    *,
    sku_categories ( id, category_name ),
    sku_brands ( id, brand_name ),
    sku_uoms ( id, uom_code, uom_name )
  `,
    { count: "exact" }
  )

  if (params.globalFilter) {
    query = query.or(
      `sku_code.ilike.%${params.globalFilter}%,item_name.ilike.%${params.globalFilter}%,barcode.ilike.%${params.globalFilter}%`
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

  const formattedData = (data || []).map((item: any) => ({
    ...item,
    uom: item.sku_uoms?.uom_code ?? "",
  }))

  return { data: formattedData, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE SKU
// ==========================================
export async function getSkuAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "skus")) {
    throw new Error("Forbidden: You cannot view this SKU.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("skus")
    .select(
      `
    *,
    sku_categories ( id, category_name ),
    sku_brands ( id, brand_name ),
    sku_uoms ( id, uom_code, uom_name )
  `
    )
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)

  return {
    ...data,
    uom: data.sku_uoms?.uom_code ?? "",
  } as SkuStoreType
}

// ==========================================
// 3. CREATE SKU
// ==========================================
export async function createSkuAction(value: SkuFormValues) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "skus")) {
    throw new Error("Forbidden: You do not have permission to create SKUs.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("skus")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE SKU
// ==========================================
export async function updateSkuAction(
  id: string | number,
  updates: Partial<SkuStoreType>
) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "skus")) {
    throw new Error("Forbidden: You do not have permission to update SKUs.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("skus")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE SKU
// ==========================================
export async function deleteSkuAction(id: string) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "skus")) {
    throw new Error("Forbidden: You do not have permission to delete SKUs.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("skus")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. DROPDOWN OPTIONS & LOOKUPS
// ==========================================
export async function fetchSkuCategoriesOptionsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "sku_categories")) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("sku_categories")
    .select("id, category_name")
    .order("category_name")
  return data || []
}

export async function fetchSkuBrandsOptionsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "sku_brands")) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("sku_brands")
    .select("id, brand_name")
    .order("brand_name")
  return data || []
}

export async function fetchSkuUomsOptionsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "sku_uoms")) return []

  const supabase = await createClient()
  const { data } = await supabase
    .from("sku_uoms")
    .select("id, uom_code, uom_name")
    .order("uom_code")
  return data || []
}

export async function searchSkusAction(queryText: string = "", limit = 20) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "skus")) return []

  const supabase = await createClient()
  let query = supabase
    .from("skus")
    .select(
      `
    id, sku_code, item_name, barcode,
    sku_uoms ( uom_code, uom_name )
  `
    )
    .order("sku_code", { ascending: true })
    .limit(limit)

  if (queryText.trim()) {
    query = query.or(
      `sku_code.ilike.%${queryText.trim()}%,item_name.ilike.%${queryText.trim()}%,barcode.ilike.%${queryText.trim()}%`
    )
  }

  const { data, error } = await query
  if (error) throw new Error(error.message)

  return ((data as any[]) || []).map((item) => ({
    ...item,
    uom: item.sku_uoms?.uom_code ?? "",
  })) as SkuStoreType[]
}
