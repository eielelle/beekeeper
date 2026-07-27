"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchSalesGroupsParams,
  SalesGroupStoreType,
} from "@/forms/queries/sales_group.query"

// ==========================================
// 1. FETCH ALL SALES GROUPS
// ==========================================
export async function fetchSalesGroupsAction(params: FetchSalesGroupsParams) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sales_groups")) {
    throw new Error(
      "Forbidden: You do not have permission to view sales groups."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("sales_groups").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.ilike("name", `%${params.globalFilter}%`)
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
// 2. GET SINGLE SALES GROUP
// ==========================================
export async function getSalesGroupAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sales_groups")) {
    throw new Error("Forbidden: You cannot view this sales group.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_groups")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 3. CREATE SALES GROUP
// ==========================================
export async function createSalesGroupAction(value: SalesGroupStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "sales_groups")) {
    throw new Error(
      "Forbidden: You do not have permission to create sales groups."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_groups")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. UPDATE SALES GROUP
// ==========================================
export async function updateSalesGroupAction(value: SalesGroupStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "sales_groups")) {
    throw new Error(
      "Forbidden: You do not have permission to update sales groups."
    )
  }

  const { id, created_at, org_id, ...updates } = value
  if (!id) throw new Error("Sales Group ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_groups")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. DELETE SALES GROUP
// ==========================================
export async function deleteSalesGroupAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "sales_groups")) {
    throw new Error(
      "Forbidden: You do not have permission to delete sales groups."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("sales_groups")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. COMBOBOX HELPER
// ==========================================
export async function searchSalesGroupOptionsAction(searchTerm: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "sales_groups")) return []

  const supabase = await createClient()
  // Fixed logic bug: changed from outlet_name/group_name to standard 'name' column based on type
  let query = supabase.from("sales_groups").select("id, name")

  if (searchTerm) {
    query = query.ilike("name", `%${searchTerm}%`)
  }

  const { data, error } = await query.limit(20)
  if (error) throw new Error(error.message)

  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}
