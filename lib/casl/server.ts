"use server"

import { createClient } from "../supabase-server"
import { buildAbility, AppAbility } from "./factory"

export async function fetchUserPermissions(): Promise<{
  permissions: string[]
  isSuperuser: boolean
}> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { permissions: [], isSuperuser: false }

  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      is_superuser,
      roles (
        role_permissions (
          permissions ( name )
        )
      )
    `
    )
    .eq("user_id", user.id)
    .single()

  if (error || !data) return { permissions: [], isSuperuser: false }

  if (data.is_superuser) return { permissions: [], isSuperuser: true }

  // 1. Safely handle whether Supabase returns the role as an object or an array
  const userRole = Array.isArray(data.roles) ? data.roles[0] : data.roles

  const rolePermissions = userRole?.role_permissions || []

  // 2. Safely extract the permission name
  const permissions = rolePermissions
    .map((rp: any) => {
      // Supabase might also type the joined permission as an array
      const perm = Array.isArray(rp.permissions)
        ? rp.permissions[0]
        : rp.permissions
      return perm?.name
    })
    .filter(Boolean)

  return { permissions, isSuperuser: false }
}

/**
 * Convenience helper for Server Actions & Route Handlers
 */
export async function getServerAbility(): Promise<AppAbility> {
  const { permissions, isSuperuser } = await fetchUserPermissions()
  return buildAbility(permissions, isSuperuser)
}
