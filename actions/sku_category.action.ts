"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchSkuCategoriesParams,
  SkuCategoryStoreType,
} from "@/forms/queries/sku_category.query"

// ==========================================
// 1. FETCH ALL SKU CATEGORIES
// ==========================================
export async function fetchSkuCategoriesAction(
  params: FetchSkuCategoriesParams
) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sku_categories")) {
    throw new Error(
      "Forbidden: You do not have permission to view SKU categories."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("sku_categories").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.ilike("category_name", `%${params.globalFilter}%`)
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
// 2. GET SINGLE SKU CATEGORY
// ==========================================
export async function getSkuCategoryAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sku_categories")) {
    throw new Error("Forbidden: You cannot view this SKU category.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_categories")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE SKU CATEGORY
// ==========================================
export async function createSkuCategoryAction(value: SkuCategoryStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "sku_categories")) {
    throw new Error(
      "Forbidden: You do not have permission to create SKU categories."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_categories")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE SKU CATEGORY
// ==========================================
export async function updateSkuCategoryAction(value: SkuCategoryStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "sku_categories")) {
    throw new Error(
      "Forbidden: You do not have permission to update SKU categories."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Category ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_categories")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE SKU CATEGORY
// ==========================================
export async function deleteSkuCategoryAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "sku_categories")) {
    throw new Error(
      "Forbidden: You do not have permission to delete SKU categories."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sku_categories")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
