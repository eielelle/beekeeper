"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchSkuBrandsParams,
  SkuBrandStoreType,
} from "@/forms/queries/sku_brand.query"

// ==========================================
// 1. FETCH ALL SKU BRANDS
// ==========================================
export async function fetchSkuBrandsAction(params: FetchSkuBrandsParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sku_brands")) {
    throw new Error("Forbidden: You do not have permission to view SKU brands.")
  }

  const supabase = await createClient()
  let query = supabase.from("sku_brands").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.ilike("brand_name", `%${params.globalFilter}%`)
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
// 2. GET SINGLE SKU BRAND
// ==========================================
export async function getSkuBrandAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sku_brands")) {
    throw new Error("Forbidden: You cannot view this SKU brand.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_brands")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE SKU BRAND
// ==========================================
export async function createSkuBrandAction(value: SkuBrandStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "sku_brands")) {
    throw new Error(
      "Forbidden: You do not have permission to create SKU brands."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_brands")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE SKU BRAND
// ==========================================
export async function updateSkuBrandAction(value: SkuBrandStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "sku_brands")) {
    throw new Error(
      "Forbidden: You do not have permission to update SKU brands."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Brand ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_brands")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE SKU BRAND
// ==========================================
export async function deleteSkuBrandAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "sku_brands")) {
    throw new Error(
      "Forbidden: You do not have permission to delete SKU brands."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_brands")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
