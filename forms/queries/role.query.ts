import { toast } from "sonner"
import {
  fetchPermissionsAction,
  fetchRolesAction,
  createRoleAction,
  CreateRolePayload,
  updateRoleAction,
  deleteRoleAction,
} from "@/actions/role.action"

export type Permission = {
  id: number
  name: string
  description: string | null
}
export type Role = { id: number; role_name: string; permissions: string[] }

export async function fetchPermissions() {
  try {
    return (await fetchPermissionsAction()) as Permission[]
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch permissions"
    toast.error(`ERR: ${message}`)
    return []
  }
}

export async function fetchRoles() {
  try {
    return (await fetchRolesAction()) as Role[]
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch roles"
    toast.error(`ERR: ${message}`)
    return []
  }
}

export async function createRole(payload: CreateRolePayload) {
  const t = toast.loading("Creating Role. Please wait.")
  try {
    const data = await createRoleAction(payload)
    toast.dismiss(t)
    toast.success("Role successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateRole(id: number, payload: CreateRolePayload) {
  const t = toast.loading("Updating Role. Please wait.")
  try {
    const data = await updateRoleAction(id, payload)
    toast.dismiss(t)
    toast.success("Role successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteRole(id: number) {
  const t = toast.loading("Deleting Role. Please wait.")
  try {
    const data = await deleteRoleAction(id)
    toast.dismiss(t)
    toast.success("Role successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(
      `ERR: Cannot delete role. It may be assigned to active employees.`
    )
    throw error
  }
}
