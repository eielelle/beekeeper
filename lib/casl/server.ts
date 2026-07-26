import { createClient } from "@/lib/supabase/server"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AppAbility } from "./factory"

type PermissionRecord = { name: string }
type RolePermissionRecord = { permissions: PermissionRecord | null }
type RoleRecord = { role_permissions: RolePermissionRecord[] | null }

// 1. Exported helper used by Root Layout
export async function fetchUserPermissions() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return {
      permissions: [],
      isSuperuser: false,
      employeeId: null,
      userId: null,
    }

  const { data: employee, error } = await supabase
    .from("employees")
    .select(
      `
      id,
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

  if (error || !employee) {
    return {
      permissions: [],
      isSuperuser: false,
      employeeId: null,
      userId: user.id,
    }
  }

  const rawRoles = employee.roles as unknown as RoleRecord | RoleRecord[] | null
  const roleData = Array.isArray(rawRoles) ? rawRoles[0] : rawRoles

  const permissions: string[] =
    roleData?.role_permissions
      ?.map((rp) => rp.permissions?.name)
      .filter((name): name is string => typeof name === "string") || []

  return {
    permissions,
    isSuperuser: !!employee.is_superuser,
    employeeId: employee.id,
    userId: user.id,
  }
}

// 2. Server Ability builder used by Server Actions
export async function getServerAbility(): Promise<AppAbility> {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
  const { permissions, isSuperuser, employeeId, userId } =
    await fetchUserPermissions()

  if (isSuperuser) {
    can("manage", "all")
    return build()
  }

  permissions.forEach((perm: string) => {
    switch (perm) {
      // EMPLOYEES
      case "read_employee":
        can("read", "employees")
        break
      case "create_employee":
        can("create", "employees")
        break
      case "update_employee":
        can("update", "employees")
        break
      case "delete_employee":
        can("delete", "employees")
        break

      // ATTENDANCES
      case "read_my_attendances":
        if (employeeId) can("read", "attendances", { employee_id: employeeId })
        break
      case "read_all_attendances":
        can("read", "attendances")
        break
      case "create_attendance":
        can("create", "attendances")
        break
      case "update_attendance":
        can("update", "attendances")
        break
      case "delete_attendance":
        can("delete", "attendances")
        break

      // LEAVES
      case "read_my_leaves":
        if (employeeId) can("read", "leaves", { employee_id: employeeId })
        break
      case "read_all_leaves":
        can("read", "leaves")
        break
      case "create_leave":
        can("create", "leaves")
        break
      case "update_leave":
        can("update", "leaves")
        break
      case "delete_leave":
        can("delete", "leaves")
        break

      // INVENTORY
      case "read_my_inventory":
        if (userId) can("read", "inventories", { created_by: userId })
        break
      case "read_all_inventory":
        can("read", "inventories")
        break
      case "create_inventory":
        can("create", "inventories")
        break
      case "update_inventory":
        can("update", "inventories")
        break
      case "delete_inventory":
        can("delete", "inventories")
        break

      // VISITS
      case "read_my_visits":
        can("read", "visits", { is_assigned: true })
        break
      case "read_all_visits":
        can("read", "visits")
        break
      case "create_visit":
        can("create", "visits")
        break
      case "update_visit":
        can("update", "visits")
        break
      case "delete_visit":
        can("delete", "visits")
        break

      // OUTLETS
      case "read_assigned_outlets":
        can("read", "outlets", { is_assigned: true })
        break
      case "read_all_outlets":
        can("read", "outlets")
        break
      case "create_outlet":
        can("create", "outlets")
        break
      case "update_outlet":
        can("update", "outlets")
        break
      case "delete_outlet":
        can("delete", "outlets")
        break
      case "assign_outlets":
        can("assign", "outlets")
        break

      // SALES BOOKINGS
      case "read_my_bookings":
        if (employeeId)
          can("read", "sales_bookings", { employee_id: employeeId })
        break
      case "read_all_bookings":
        can("read", "sales_bookings")
        break
      case "create_booking":
        can("create", "sales_bookings")
        break
      case "update_booking":
        can("update", "sales_bookings")
        break
      case "delete_booking":
        can("delete", "sales_bookings")
        break
    }
  })

  can("update", "approval_requests")

  return build()
}
