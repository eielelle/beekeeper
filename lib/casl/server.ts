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

      // EMPLOYEE WORK INFO (Strict HR Permissions)
      case "read_employee_work_info":
        can("read", "employee_work_info")
        break
      case "manage_employee_work_info":
        can("create", "employee_work_info")
        can("update", "employee_work_info")
        can("delete", "employee_work_info")
        break
      // (Optional) Let employees see their own govt numbers
      case "read_my_work_info":
        if (employeeId)
          can("read", "employee_work_info", { employee_id: employeeId })
        break

      // WORK TYPES
      case "read_work_types":
        can("read", "work_types")
        break
      case "create_work_type":
        can("create", "work_types")
        break
      case "update_work_type":
        can("update", "work_types")
        break
      case "delete_work_type":
        can("delete", "work_types")
        break

      // VISIT TYPES
      case "read_visit_types":
        can("read", "visit_types")
        break
      case "create_visit_type":
        can("create", "visit_types")
        break
      case "update_visit_type":
        can("update", "visit_types")
        break
      case "delete_visit_type":
        can("delete", "visit_types")
        break

      // VISIT PLANS
      case "read_visit_plans":
        can("read", "visit_plans")
        break
      case "create_visit_plan":
        can("create", "visit_plans")
        break
      case "update_visit_plan":
        can("update", "visit_plans")
        break
      case "delete_visit_plan":
        can("delete", "visit_plans")
        break

      // SKU UOMs
      case "read_sku_uoms":
        can("read", "sku_uoms")
        break
      case "create_sku_uom":
        can("create", "sku_uoms")
        break
      case "update_sku_uom":
        can("update", "sku_uoms")
        break
      case "delete_sku_uom":
        can("delete", "sku_uoms")
        break

      // SKU CATEGORIES
      case "read_sku_categories":
        can("read", "sku_categories")
        break
      case "create_sku_category":
        can("create", "sku_categories")
        break
      case "update_sku_category":
        can("update", "sku_categories")
        break
      case "delete_sku_category":
        can("delete", "sku_categories")
        break

      // SKU BRANDS
      case "read_sku_brands":
        can("read", "sku_brands")
        break
      case "create_sku_brand":
        can("create", "sku_brands")
        break
      case "update_sku_brand":
        can("update", "sku_brands")
        break
      case "delete_sku_brand":
        can("delete", "sku_brands")
        break

      // SKUS
      case "read_skus":
        can("read", "skus")
        break
      case "create_sku":
        can("create", "skus")
        break
      case "update_sku":
        can("update", "skus")
        break
      case "delete_sku":
        can("delete", "skus")
        break

      // SHIFT TYPES
      case "read_shift_types":
        can("read", "shift_types")
        break
      case "create_shift_type":
        can("create", "shift_types")
        break
      case "update_shift_type":
        can("update", "shift_types")
        break
      case "delete_shift_type":
        can("delete", "shift_types")
        break

      // SALES GROUPS
      case "read_sales_groups":
        can("read", "sales_groups")
        break
      case "create_sales_group":
        can("create", "sales_groups")
        break
      case "update_sales_group":
        can("update", "sales_groups")
        break
      case "delete_sales_group":
        can("delete", "sales_groups")
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
