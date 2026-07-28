import { MongoAbility } from "@casl/ability"

export type AppAction =
  "manage" | "create" | "read" | "update" | "delete" | "assign"

export interface EmployeeSubject {
  employee_id?: number | string
  is_superuser?: boolean
}

export interface LeaveSubject {
  employee_id?: number | string
}

export interface InventorySubject {
  created_by?: string
}

export interface VisitSubject {
  is_assigned?: boolean
}

export interface OutletSubject {
  is_assigned?: boolean
}

export interface SalesBookingSubject {
  employee_id?: number | string
}

export type AppSubject =
  | "all"
  | "employees"
  | "attendances"
  | "leaves"
  | "inventories"
  | "visits"
  | "outlets"
  | "sales_bookings"
  | "approval_requests"
  | "employee_work_info"
  | "work_types"
  | "visit_types"
  | "visit_plans"
  | "sku_uoms"
  | "sku_categories"
  | "sku_brands"
  | "skus"
  | "shift_types"
  | "sales_groups"
  | "production_areas"
  | "production_lines"
  | "productions"
  | "employment_statuses"
  | "employment_types"
  | "organizations"
  | "roles"
  | "announcements"
  | "approval_rules"
  | "positions"
  | EmployeeSubject
  | LeaveSubject
  | InventorySubject
  | VisitSubject
  | OutletSubject
  | SalesBookingSubject

export type AppAbility = MongoAbility<[AppAction, AppSubject]>
