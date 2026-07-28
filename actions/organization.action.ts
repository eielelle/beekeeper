"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import {
  FetchOrganizationsParams,
  OrganizationStoreType,
} from "@/forms/queries/organization.query"

// ==========================================
// 1. FETCH ALL ORGANIZATIONS (No Pagination)
// ==========================================
export async function fetchAllOrganizationsAction() {
  const ability = await getServerAbility()

  if (ability.cannot("read", "organizations")) {
    throw new Error(
      "Forbidden: You do not have permission to view organizations."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.from("organizations").select("*")

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 2. FETCH ORGANIZATIONS (Paginated/Sorted)
// ==========================================
export async function fetchOrganizationsAction(
  params: FetchOrganizationsParams
) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "organizations")) {
    throw new Error(
      "Forbidden: You do not have permission to view organizations."
    )
  }

  const supabase = await createClient()
  let query = supabase.from("organizations").select("*", { count: "exact" })

  if (params.globalFilter) {
    query = query.or(
      `organization_name.ilike.%${params.globalFilter}%,organization_code.ilike.%${params.globalFilter}%`
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
// 3. GET SINGLE ORGANIZATION
// ==========================================
export async function getOrganizationAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "organizations")) {
    throw new Error("Forbidden: You cannot view this organization.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 4. CREATE ORGANIZATION
// ==========================================
export async function createOrganizationAction(value: OrganizationStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("create", "organizations")) {
    throw new Error(
      "Forbidden: You do not have permission to create organizations."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organizations")
    .insert([value])
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 5. UPDATE ORGANIZATION
// ==========================================
export async function updateOrganizationAction(value: OrganizationStoreType) {
  const ability = await getServerAbility()

  if (ability.cannot("update", "organizations")) {
    throw new Error(
      "Forbidden: You do not have permission to update organizations."
    )
  }

  const { id, created_at, ...updates } = value
  if (!id) throw new Error("Organization ID is required for updates.")

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organizations")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}

// ==========================================
// 6. DELETE ORGANIZATION
// ==========================================
export async function deleteOrganizationAction(id: string) {
  const ability = await getServerAbility()

  if (ability.cannot("delete", "organizations")) {
    throw new Error(
      "Forbidden: You do not have permission to delete organizations."
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("organizations")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data
}
