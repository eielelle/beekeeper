"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import {
  EmployeeWorkFormValues,
  employeeWorkInfoSchema,
} from "@/forms/schemas/employee_work_info.schema"

// ==========================================
// 1. GET WORK INFO
// ==========================================
export async function getEmployeeWorkInfoAction(employeeId: string | number) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (
    ability.cannot(
      "read",
      subject("employee_work_info", { employee_id: employeeId })
    )
  ) {
    throw new Error(
      "Forbidden: You do not have HR permissions to view this work information."
    )
  }

  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      id,
      reports_to_id,
      effective_start_date,
      original_hire_date,
      current_hire_date,
      probation_end_date,
      regularization_date,
      contract_expiry_date,
      employee_work_information (
        department_id,
        position_id,
        employment_type_id,
        work_type_id,
        employment_status_id,
        sss_number,
        tin,
        philhealth_number,
        pagibig_number,
        rdo_code,
        national_id
      )
    `
    )
    .eq("id", employeeId)
    .single()

  if (error && error.code !== "PGRST116") {
    throw new Error(error.message)
  }

  if (!data) return null

  const ewi = Array.isArray(data.employee_work_information)
    ? data.employee_work_information[0]
    : data.employee_work_information

  const mappedData: Partial<EmployeeWorkFormValues> = {
    effective_start_date: data.effective_start_date || "",
    reports_to_id: data.reports_to_id ? String(data.reports_to_id) : undefined,

    department_id: ewi?.department_id ? String(ewi.department_id) : undefined,
    job_position_id: ewi?.position_id ? String(ewi.position_id) : undefined,
    employment_type_id: ewi?.employment_type_id
      ? String(ewi.employment_type_id)
      : undefined,
    work_type_id: ewi?.work_type_id ? String(ewi.work_type_id) : undefined,
    employment_status_id: ewi?.employment_status_id
      ? String(ewi.employment_status_id)
      : undefined,

    lifecycles: {
      original_hire_date: data.original_hire_date || "",
      current_hire_date: data.current_hire_date || "",
      probation_end_date: data.probation_end_date || "",
      regularization_date: data.regularization_date || "",
      contract_expiry_date: data.contract_expiry_date || "",
    },
    statutory: {
      sss_number: ewi?.sss_number || "",
      tin: ewi?.tin || "",
      rdo_code: ewi?.rdo_code || "",
      philhealth_number: ewi?.philhealth_number || "",
      pagibig_number: ewi?.pagibig_number || "",
      national_id: ewi?.national_id || "",
    },
  }

  return mappedData
}

// ==========================================
// 2. UPSERT WORK INFO
// ==========================================
export async function upsertEmployeeWorkInfoAction(
  employeeId: string | number,
  value: EmployeeWorkFormValues
) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (
    ability.cannot("update", "employee_work_info") &&
    ability.cannot("create", "employee_work_info")
  ) {
    throw new Error(
      "Forbidden: You do not have permissions to modify work information."
    )
  }

  const validatedFields = employeeWorkInfoSchema.safeParse(value)
  if (!validatedFields.success) {
    throw new Error("Validation failed. Please check form errors.")
  }

  const parsedValue = validatedFields.data

  const employeeUpdates = {
    reports_to_id: parsedValue.reports_to_id
      ? Number(parsedValue.reports_to_id)
      : null,
    effective_start_date: parsedValue.effective_start_date || null,
    original_hire_date: parsedValue.lifecycles?.original_hire_date || null,
    current_hire_date: parsedValue.lifecycles?.current_hire_date || null,
    probation_end_date: parsedValue.lifecycles?.probation_end_date || null,
    regularization_date: parsedValue.lifecycles?.regularization_date || null,
    contract_expiry_date: parsedValue.lifecycles?.contract_expiry_date || null,
  }

  const { error: empError } = await supabase
    .from("employees")
    .update(employeeUpdates)
    .eq("id", employeeId)

  if (empError) throw new Error(empError.message)

  const ewiUpdates = {
    employee_id: Number(employeeId),
    department_id: parsedValue.department_id
      ? Number(parsedValue.department_id)
      : null,
    position_id: parsedValue.job_position_id
      ? Number(parsedValue.job_position_id)
      : null,
    employment_type_id: parsedValue.employment_type_id
      ? Number(parsedValue.employment_type_id)
      : null,
    work_type_id: parsedValue.work_type_id
      ? Number(parsedValue.work_type_id)
      : null,
    employment_status_id: parsedValue.employment_status_id
      ? Number(parsedValue.employment_status_id)
      : null,

    sss_number: parsedValue.statutory?.sss_number || null,
    tin: parsedValue.statutory?.tin || null,
    rdo_code: parsedValue.statutory?.rdo_code || null,
    philhealth_number: parsedValue.statutory?.philhealth_number || null,
    pagibig_number: parsedValue.statutory?.pagibig_number || null,
    national_id: parsedValue.statutory?.national_id || null,
  }

  const { error: ewiError } = await supabase
    .from("employee_work_information")
    .upsert([ewiUpdates], { onConflict: "employee_id" })

  if (ewiError) throw new Error(ewiError.message)

  return true
}

// ==========================================
// 3. DROPDOWN QUERIES
// ==========================================
export async function searchEmploymentTypesAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("employment_types").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchEmploymentStatusesAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("employment_statuses").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchWorkTypesAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("work_types").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchDepartmentsAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("departments").select("id, name")
  if (searchTerm) query = query.ilike("name", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.name,
  }))
}

export async function searchPositionsAction(searchTerm: string) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) return []

  const supabase = await createClient()
  let query = supabase.from("positions").select("id, title")
  if (searchTerm) query = query.ilike("title", `%${searchTerm}%`)

  const { data } = await query.limit(20)
  return (data || []).map((item) => ({
    value: String(item.id),
    label: item.title,
  }))
}
