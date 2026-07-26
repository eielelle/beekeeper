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
  | EmployeeSubject
  | LeaveSubject
  | InventorySubject
  | VisitSubject
  | OutletSubject
  | SalesBookingSubject

export type AppAbility = MongoAbility<[AppAction, AppSubject]>
