import { createClient } from "@/lib/supabase/server"
import { AbilityBuilder, createMongoAbility } from "@casl/ability"
import { AppAbility, AppAction, AppSubject } from "./factory" // Ensure this matches your file name

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
      `id, is_superuser, roles ( role_permissions ( permissions ( name ) ) )`
    )
    .eq("user_id", user.id)
    .single()

  if (error || !employee)
    return {
      permissions: [],
      isSuperuser: false,
      employeeId: null,
      userId: user.id,
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

// ------------------------------------------------------------------
// COMPACT PERMISSION MAP: Standard 1:1 "String to Action/Subject" mappings
// ------------------------------------------------------------------
const standardRules: Record<string, [AppAction, Extract<AppSubject, string>]> =
  {
    // Configs & Masters
    read_employee: ["read", "employees"],
    create_employee: ["create", "employees"],
    update_employee: ["update", "employees"],
    delete_employee: ["delete", "employees"],
    read_work_types: ["read", "work_types"],
    create_work_type: ["create", "work_types"],
    update_work_type: ["update", "work_types"],
    delete_work_type: ["delete", "work_types"],
    read_employment_statuses: ["read", "employment_statuses"],
    create_employment_status: ["create", "employment_statuses"],
    update_employment_status: ["update", "employment_statuses"],
    delete_employment_status: ["delete", "employment_statuses"],
    read_organizations: ["read", "organizations"],
    create_organization: ["create", "organizations"],
    update_organization: ["update", "organizations"],
    delete_organization: ["delete", "organizations"],
    read_approval_rules: ["read", "approval_rules"],
    create_approval_rule: ["create", "approval_rules"],
    update_approval_rule: ["update", "approval_rules"],
    delete_approval_rule: ["delete", "approval_rules"],
    read_positions: ["read", "positions"],
    create_position: ["create", "positions"],
    update_position: ["update", "positions"],
    delete_position: ["delete", "positions"],
    read_roles: ["read", "roles"],
    create_role: ["create", "roles"],
    update_role: ["update", "roles"],
    delete_role: ["delete", "roles"],
    read_announcements: ["read", "announcements"],
    create_announcement: ["create", "announcements"],
    update_announcement: ["update", "announcements"],
    delete_announcement: ["delete", "announcements"],
    read_employment_types: ["read", "employment_types"],
    create_employment_type: ["create", "employment_types"],
    update_employment_type: ["update", "employment_types"],
    delete_employment_type: ["delete", "employment_types"],
    read_visit_types: ["read", "visit_types"],
    create_visit_type: ["create", "visit_types"],
    update_visit_type: ["update", "visit_types"],
    delete_visit_type: ["delete", "visit_types"],
    read_visit_plans: ["read", "visit_plans"],
    create_visit_plan: ["create", "visit_plans"],
    update_visit_plan: ["update", "visit_plans"],
    delete_visit_plan: ["delete", "visit_plans"],
    read_sku_uoms: ["read", "sku_uoms"],
    create_sku_uom: ["create", "sku_uoms"],
    update_sku_uom: ["update", "sku_uoms"],
    delete_sku_uom: ["delete", "sku_uoms"],
    read_sku_categories: ["read", "sku_categories"],
    create_sku_category: ["create", "sku_categories"],
    update_sku_category: ["update", "sku_categories"],
    delete_sku_category: ["delete", "sku_categories"],
    read_sku_brands: ["read", "sku_brands"],
    create_sku_brand: ["create", "sku_brands"],
    update_sku_brand: ["update", "sku_brands"],
    delete_sku_brand: ["delete", "sku_brands"],
    read_skus: ["read", "skus"],
    create_sku: ["create", "skus"],
    update_sku: ["update", "skus"],
    delete_sku: ["delete", "skus"],
    read_shift_types: ["read", "shift_types"],
    create_shift_type: ["create", "shift_types"],
    update_shift_type: ["update", "shift_types"],
    delete_shift_type: ["delete", "shift_types"],
    read_sales_groups: ["read", "sales_groups"],
    create_sales_group: ["create", "sales_groups"],
    update_sales_group: ["update", "sales_groups"],
    delete_sales_group: ["delete", "sales_groups"],
    read_production_areas: ["read", "production_areas"],
    create_production_area: ["create", "production_areas"],
    update_production_area: ["update", "production_areas"],
    delete_production_area: ["delete", "production_areas"],
    read_production_lines: ["read", "production_lines"],
    create_production_line: ["create", "production_lines"],
    update_production_line: ["update", "production_lines"],
    delete_production_line: ["delete", "production_lines"],
    read_productions: ["read", "productions"],
    create_production: ["create", "productions"],
    update_production: ["update", "productions"],
    delete_production: ["delete", "productions"],

    // Transactions ("read_all" variations & mutators)
    read_employee_work_info: ["read", "employee_work_info"],
    read_all_attendances: ["read", "attendances"],
    create_attendance: ["create", "attendances"],
    update_attendance: ["update", "attendances"],
    delete_attendance: ["delete", "attendances"],
    read_all_leaves: ["read", "leaves"],
    create_leave: ["create", "leaves"],
    update_leave: ["update", "leaves"],
    delete_leave: ["delete", "leaves"],
    read_all_inventory: ["read", "inventories"],
    create_inventory: ["create", "inventories"],
    update_inventory: ["update", "inventories"],
    delete_inventory: ["delete", "inventories"],
    read_all_visits: ["read", "visits"],
    create_visit: ["create", "visits"],
    update_visit: ["update", "visits"],
    delete_visit: ["delete", "visits"],
    read_all_outlets: ["read", "outlets"],
    create_outlet: ["create", "outlets"],
    update_outlet: ["update", "outlets"],
    delete_outlet: ["delete", "outlets"],
    assign_outlets: ["assign", "outlets"],
    read_all_bookings: ["read", "sales_bookings"],
    create_booking: ["create", "sales_bookings"],
    update_booking: ["update", "sales_bookings"],
    delete_booking: ["delete", "sales_bookings"],
  }

// 2. Server Ability builder
export async function getServerAbility(): Promise<AppAbility> {
  const { can, build } = new AbilityBuilder<AppAbility>(createMongoAbility)
  const { permissions, isSuperuser, employeeId, userId } =
    await fetchUserPermissions()

  // Superusers bypass all rules
  if (isSuperuser) {
    can("manage", "all")
    return build()
  }

  permissions.forEach((perm: string) => {
    // A. Apply standard unconditional mappings automatically from the dictionary
    if (standardRules[perm]) {
      can(standardRules[perm][0], standardRules[perm][1])
      return
    }

    // B. Handle complex & scoped rules manually
    switch (perm) {
      case "manage_employee_work_info":
        can("create", "employee_work_info")
        can("update", "employee_work_info")
        can("delete", "employee_work_info")
        break
      case "read_my_work_info":
        if (employeeId)
          can("read", "employee_work_info", { employee_id: employeeId })
        break
      case "read_my_attendances":
        if (employeeId) can("read", "attendances", { employee_id: employeeId })
        break
      case "read_my_leaves":
        if (employeeId) can("read", "leaves", { employee_id: employeeId })
        break
      case "read_my_inventory":
        if (userId) can("read", "inventories", { created_by: userId })
        break
      case "read_my_visits":
        can("read", "visits", { is_assigned: true })
        break
      case "read_assigned_outlets":
        can("read", "outlets", { is_assigned: true })
        break
      case "read_my_bookings":
        if (employeeId)
          can("read", "sales_bookings", { employee_id: employeeId })
        break
    }
  })

  // Global defaults that all users have access to (Workflow driven)
  can("read", "approval_requests")

  return build()
}
