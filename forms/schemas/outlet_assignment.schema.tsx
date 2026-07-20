import { z } from "zod"

export const outletAssignmentSchema = z.object({
  employee_id: z.coerce.number().min(1, "Employee is required"),
  outlet_id: z.coerce.number().min(1, "Outlet is required"),
  org_id: z.coerce.number().optional(),
})

export type OutletAssignmentFormValues = z.infer<typeof outletAssignmentSchema>

export interface EmployeeOutletRow {
  id: number
  employee_id: number
  outlet_id: number
  employees: {
    first_name: string | null
    last_name: string | null
    employee_no: string | null
  }
  outlets: {
    outlet_name: string
    outlet_code: string
    city: string | null
  }
}
