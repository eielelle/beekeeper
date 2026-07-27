import { toast } from "sonner"
import {
  getEmployeeWorkInfoAction,
  upsertEmployeeWorkInfoAction,
  searchEmploymentTypesAction,
  searchEmploymentStatusesAction,
  searchWorkTypesAction,
  searchDepartmentsAction,
  searchPositionsAction,
} from "@/actions/employee_work_info.action"

export type EmployeeWorkInfoStoreType = {
  id?: string | number
  employee_id: number
  employment_type_id?: number
  employment_status_id?: number
  work_type_id?: string
  department_id?: number
  position_id?: number
  sss_no?: string
  tin_no?: string
  philhealth_no?: string
  pagibig_no?: string
  emergency_contact_name?: string
  emergency_contact_no?: string
  emergency_relation?: string
  allow_overtime?: boolean
}

// --- CRUD Operations ---

export async function getEmployeeWorkInfo(employeeId: string) {
  try {
    return await getEmployeeWorkInfoAction(employeeId)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    return null
  }
}

export async function upsertEmployeeWorkInfo(value: EmployeeWorkInfoStoreType) {
  const t = toast.loading("Saving work information...")
  try {
    await upsertEmployeeWorkInfoAction(value)
    toast.dismiss(t)
    toast.success("Work information successfully saved.")
    return true
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}

// --- Dropdown Search Queries ---

export async function searchEmploymentTypes(searchTerm: string) {
  try {
    return await searchEmploymentTypesAction(searchTerm)
  } catch (error) {
    return []
  }
}

export async function searchEmploymentStatuses(searchTerm: string) {
  try {
    return await searchEmploymentStatusesAction(searchTerm)
  } catch (error) {
    return []
  }
}

export async function searchWorkTypes(searchTerm: string) {
  try {
    return await searchWorkTypesAction(searchTerm)
  } catch (error) {
    return []
  }
}

export async function searchDepartments(searchTerm: string) {
  try {
    return await searchDepartmentsAction(searchTerm)
  } catch (error) {
    return []
  }
}

export async function searchPositions(searchTerm: string) {
  try {
    return await searchPositionsAction(searchTerm)
  } catch (error) {
    return []
  }
}
