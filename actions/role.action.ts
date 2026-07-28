"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"

export type CreateRolePayload = {
  role_name: string
  org_id: number
  permission_ids: number[]
}

export async function fetchPermissionsAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "roles")) {
    throw new Error("Forbidden: You do not have permission to view roles.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("permissions")
    .select("*")
    .order("name")

  if (error) throw new Error(error.message)
  return data
}

export async function fetchRolesAction() {
  const ability = await getServerAbility()
  if (ability.cannot("read", "roles")) {
    throw new Error("Forbidden: You do not have permission to view roles.")
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("roles")
    .select(`id, role_name, role_permissions ( permissions ( name ) )`)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  // Flatten the Supabase nested response safely
  return data.map((role: any) => ({
    id: role.id,
    role_name: role.role_name,
    permissions: role.role_permissions
      .map((rp: any) => rp.permissions?.name)
      .filter(Boolean),
  }))
}

export async function createRoleAction(payload: CreateRolePayload) {
  const ability = await getServerAbility()
  if (ability.cannot("create", "roles")) {
    throw new Error("Forbidden: You do not have permission to create roles.")
  }

  const supabase = await createClient()

  // 1. Insert Role
  const { data: newRole, error: roleError } = await supabase
    .from("roles")
    .insert({ role_name: payload.role_name, org_id: payload.org_id })
    .select()
    .single()

  if (roleError) throw new Error(`Role creation failed: ${roleError.message}`)

  // 2. Insert Permissions Mapping
  if (payload.permission_ids.length > 0) {
    const rolePermissionsToInsert = payload.permission_ids.map((permId) => ({
      role_id: newRole.id,
      permission_id: permId,
    }))

    const { error: mappingError } = await supabase
      .from("role_permissions")
      .insert(rolePermissionsToInsert)

    if (mappingError) {
      // In a real production app, you might want to rollback the role creation here using an RPC
      throw new Error(`Permission assignment failed: ${mappingError.message}`)
    }
  }

  return newRole
}

export async function updateRoleAction(id: number, payload: CreateRolePayload) {
  const ability = await getServerAbility()
  if (ability.cannot("update", "roles")) {
    throw new Error("Forbidden: You do not have permission to update roles.")
  }

  const supabase = await createClient()

  // 1. Update Role Name
  const { data: updatedRole, error: roleError } = await supabase
    .from("roles")
    .update({ role_name: payload.role_name })
    .eq("id", id)
    .select()
    .single()

  if (roleError) throw new Error(`Role update failed: ${roleError.message}`)

  // 2. Clear old permissions
  await supabase.from("role_permissions").delete().eq("role_id", id)

  // 3. Insert new Permissions Mapping
  if (payload.permission_ids.length > 0) {
    const rolePermissionsToInsert = payload.permission_ids.map((permId) => ({
      role_id: id,
      permission_id: permId,
    }))

    const { error: mappingError } = await supabase
      .from("role_permissions")
      .insert(rolePermissionsToInsert)

    if (mappingError) {
      throw new Error(`Permission assignment failed: ${mappingError.message}`)
    }
  }

  return updatedRole
}

export async function deleteRoleAction(id: number) {
  const ability = await getServerAbility()
  if (ability.cannot("delete", "roles")) {
    throw new Error("Forbidden: You do not have permission to delete roles.")
  }

  const supabase = await createClient()

  // Note: If you have foreign key constraints (like employees tied to this role),
  // this will intentionally fail to prevent breaking your system.
  const { data, error } = await supabase
    .from("roles")
    .delete()
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(`Delete failed: ${error.message}`)
  return data
}
