"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility, fetchUserPermissions } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import { FetchEmployeesParams } from "@/forms/queries/employee.query"
// import { supabaseAdmin } from "@/lib/supabase/admin" // Used for deletion if needed
import {
  CreateEmployeeFormValues,
  createEmployeeSchema,
} from "@/forms/schemas/employee.schema"

// Helper to handle profile picture uploads to Supabase Storage
// Note: Ensure you have a storage bucket named 'avatars' (or change the name below)
async function uploadProfilePicture(
  supabase: any,
  file: File,
  employeeNo: string
) {
  if (!file || file.size === 0) return null

  const fileExt = file.name.split(".").pop()
  const fileName = `${employeeNo || "emp"}-${Date.now()}.${fileExt}`

  const { error } = await supabase.storage
    .from("avatars") // <--- Change this to match your Supabase bucket name if different
    .upload(fileName, file)

  if (error) {
    throw new Error(`Failed to upload photo: ${error.message}`)
  }

  const { data } = supabase.storage.from("avatars").getPublicUrl(fileName)
  return data.publicUrl
}

// ==========================================
// 1. FETCH ALL EMPLOYEES (PAGINATED)
// ==========================================
export async function fetchEmployeesAction(params: FetchEmployeesParams) {
  const ability = await getServerAbility()
  if (ability.cannot("read", "employees")) {
    throw new Error("Forbidden: You do not have permission to view employees.")
  }

  const supabase = await createClient()

  let query = supabase.from("employees").select("*", { count: "exact" })

  console.log("BACKEND RECEIVED FILTERS:", params.columnFilters)

  // 1. GLOBAL FILTER (Searches across multiple columns using OR)
  if (params.globalFilter) {
    query = query.or(
      `employee_no.ilike.%${params.globalFilter}%,first_name.ilike.%${params.globalFilter}%,last_name.ilike.%${params.globalFilter}%,email.ilike.%${params.globalFilter}%`
    )
  }

  // 2. COLUMN-SPECIFIC FILTERS (Searches specific columns using AND)
  if (params.columnFilters && params.columnFilters.length > 0) {
    params.columnFilters.forEach((filter) => {
      const { id, value } = filter

      // 1. Handle basic string payload (from default text inputs)
      if (typeof value === "string") {
        query = query.ilike(id, `%${value}%`)
        return
      }

      // 2. TypeScript now strictly knows `value` is one of our object payloads
      switch (value.operator) {
        case "range":
          if (
            value.min !== null &&
            value.min !== undefined &&
            value.min !== ""
          ) {
            query = query.gte(id, value.min)
          }
          if (
            value.max !== null &&
            value.max !== undefined &&
            value.max !== ""
          ) {
            query = query.lte(id, value.max)
          }
          break

        case "in":
          query = query.in(id, value.values)
          break

        case "eq":
          query = query.eq(id, value.value)
          break

        case "ilike":
          query = query.ilike(id, `%${String(value.value)}%`)
          break
      }
    })
  }

  // 3. SORTING
  if (params.sorting && params.sorting.length > 0) {
    const sort = params.sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  // 4. PAGINATION
  const from = params.pageIndex * params.pageSize
  const to = from + params.pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query
  if (error) throw new Error(error.message)

  return { data, rowCount: count || 0 }
}

// ==========================================
// 2. GET SINGLE EMPLOYEE
// ==========================================
export async function getEmployeeAction(id: string) {
  const supabase = await createClient()
  const ability = await getServerAbility()

  // Allow them to read if they have global read access OR if it's their own profile
  if (ability.cannot("read", subject("employees", { employee_id: id }))) {
    throw new Error("Forbidden: You cannot view this employee's profile.")
  }

  // Update the select statement to fetch relational data
  const { data, error } = await supabase
    .from("employees")
    .select(
      `
      *,
      employee_addresses (*),
      employee_emergency_contacts (*)
    `
    )
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)

  return data
}

// ==========================================
// 3. GET CURRENT EMPLOYEE ID
// ==========================================
export async function getCurrentEmployeeIdAction() {
  const { employeeId } = await fetchUserPermissions()
  if (!employeeId) throw new Error("No employee record found for this account.")
  return String(employeeId)
}

// ==========================================
// 4. CREATE EMPLOYEE
// ==========================================
export async function createEmployeeAction(values: CreateEmployeeFormValues) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (ability.cannot("create", "employees")) {
    throw new Error(
      "Forbidden: You do not have permission to create employees."
    )
  }

  const validatedFields = createEmployeeSchema.safeParse(values)
  const validatedValues = validatedFields.data

  if (!validatedFields.success) {
    throw new Error("Validation failed. Please check form errors.")
  }

  if (validatedValues) {
    const photoFile = validatedValues.photo as File | null
    let avatar_url = ""
    if (photoFile && photoFile.size > 0) {
      const photoUrl = await uploadProfilePicture(
        supabase,
        photoFile,
        values.employee_no
      )
      avatar_url = photoUrl // Adjust if your DB column is named `photo_url`
    }

    // 1. Separate relational data from core employee data
    const {
      emergency_contacts,
      permanent_address,
      present_address,
      ...employeeValues
    } = values

    // 2. Insert core employee record FIRST to get the new ID
    const { data: newEmployee, error: employeeError } = await supabase
      .from("employees")
      .insert([{ ...employeeValues, avatar_url }])
      .select()
      .single()

    if (employeeError) throw new Error(employeeError.message)

    const employeeId = newEmployee.id

    // 3. Insert Addresses
    const addressesToInsert = []

    // Format Present Address
    if (present_address && present_address.full_address) {
      addressesToInsert.push({
        employee_id: employeeId,
        address_type: "present",
        full_address: present_address.full_address,
        street_unit: present_address.street_unit,
        barangay: present_address.barangay,
        city: present_address.city,
        province: present_address.province,
        region: present_address.region,
        zip_code: present_address.zip_code,
        is_active: present_address.is_active ?? true,
      })
    }

    // Format Permanent Address
    if (permanent_address && permanent_address.full_address) {
      addressesToInsert.push({
        employee_id: employeeId,
        address_type: "permanent",
        full_address: permanent_address.full_address,
        street_unit: permanent_address.street_unit,
        barangay: permanent_address.barangay,
        city: permanent_address.city,
        province: permanent_address.province,
        region: permanent_address.region,
        zip_code: permanent_address.zip_code,
        is_active: permanent_address.is_active ?? true,
      })
    }

    if (addressesToInsert.length > 0) {
      const { error: addressError } = await supabase
        .from("employee_addresses")
        .insert(addressesToInsert)

      if (addressError) {
        throw new Error(
          `Employee created, but failed to save addresses: ${addressError.message}`
        )
      }
    }

    // 4. Insert Emergency Contacts
    if (emergency_contacts && emergency_contacts.length > 0) {
      // Map form contacts to database schema requirement
      const contactsToInsert = emergency_contacts.map((contact) => ({
        employee_id: employeeId,
        full_name: contact.full_name,
        relationship: contact.relationship,
        mobile_number: contact.mobile_number,
        is_primary: contact.is_primary ?? false,
      }))

      const { error: contactsError } = await supabase
        .from("employee_emergency_contacts")
        .insert(contactsToInsert)

      if (contactsError) {
        throw new Error(
          `Employee created, but failed to save emergency contacts: ${contactsError.message}`
        )
      }
    }

    return newEmployee
  }
}

// ==========================================
// 5. UPDATE EMPLOYEE
// ==========================================
export async function updateEmployeeAction(
  id: string | number,
  values: CreateEmployeeFormValues
) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (!id) throw new Error("Employee ID is required.")

  // Security: Check if they can update this specific employee
  if (ability.cannot("update", subject("employees", { employee_id: id }))) {
    throw new Error(
      "Forbidden: You do not have permission to update this employee."
    )
  }

  // 1. Validate incoming data
  const validatedFields = createEmployeeSchema.safeParse(values)
  if (!validatedFields.success) {
    throw new Error("Validation failed. Please check form errors.")
  }

  const {
    emergency_contacts,
    permanent_address,
    present_address,
    photo,
    ...employeeValues
  } = validatedFields.data

  // 2. Handle Photo Upload
  let avatar_url = undefined
  if (photo instanceof File && photo.size > 0) {
    // New file uploaded
    avatar_url = await uploadProfilePicture(
      supabase,
      photo,
      employeeValues.employee_no || `emp-${id}`
    )
  } else if (typeof photo === "string") {
    // Existing photo URL kept
    avatar_url = photo
  }

  const updates: any = { ...employeeValues }
  if (avatar_url !== undefined) {
    updates.avatar_url = avatar_url
  }

  // SECURITY PATCH: Do not allow non-superusers to escalate privileges
  const { isSuperuser } = await fetchUserPermissions()
  if (!isSuperuser && updates.is_superuser !== undefined) {
    delete updates.is_superuser
  }

  // Ensure we don't accidentally try to update protected fields
  delete updates.id
  delete updates.created_at

  // 3. Update core database
  const { data: updatedEmployee, error } = await supabase
    .from("employees")
    .update(updates)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  // 4. Update Addresses (Delete existing, then insert new)
  if (present_address || permanent_address) {
    await supabase.from("employee_addresses").delete().eq("employee_id", id)

    const addressesToInsert = []

    if (present_address && present_address.full_address) {
      addressesToInsert.push({
        employee_id: id,
        address_type: "present",
        full_address: present_address.full_address,
        street_unit: present_address.street_unit,
        barangay: present_address.barangay,
        city: present_address.city,
        province: present_address.province,
        region: present_address.region,
        zip_code: present_address.zip_code,
        is_active: present_address.is_active ?? true,
      })
    }

    if (permanent_address && permanent_address.full_address) {
      addressesToInsert.push({
        employee_id: id,
        address_type: "permanent",
        full_address: permanent_address.full_address,
        street_unit: permanent_address.street_unit,
        barangay: permanent_address.barangay,
        city: permanent_address.city,
        province: permanent_address.province,
        region: permanent_address.region,
        zip_code: permanent_address.zip_code,
        is_active: permanent_address.is_active ?? true,
      })
    }

    if (addressesToInsert.length > 0) {
      const { error: addressError } = await supabase
        .from("employee_addresses")
        .insert(addressesToInsert)

      if (addressError) {
        throw new Error(
          `Employee updated, but failed to save addresses: ${addressError.message}`
        )
      }
    }
  }

  // 5. Update Emergency Contacts (Delete existing, then insert new)
  if (emergency_contacts && Array.isArray(emergency_contacts)) {
    await supabase
      .from("employee_emergency_contacts")
      .delete()
      .eq("employee_id", id)

    if (emergency_contacts.length > 0) {
      const contactsToInsert = emergency_contacts.map((contact: any) => ({
        employee_id: id,
        full_name: contact.full_name,
        relationship: contact.relationship,
        mobile_number: contact.mobile_number,
        is_primary: contact.is_primary ?? false,
      }))

      const { error: contactsError } = await supabase
        .from("employee_emergency_contacts")
        .insert(contactsToInsert)

      if (contactsError) {
        throw new Error(
          `Employee updated, but failed to save emergency contacts: ${contactsError.message}`
        )
      }
    }
  }

  return updatedEmployee
}

// ==========================================
// 6. SEARCH EMPLOYEE OPTIONS
// ==========================================
export async function searchEmployeeOptionsAction(searchTerm: string) {
  const ability = await getServerAbility()

  if (ability.cannot("read", "employees")) {
    throw new Error("Forbidden: You do not have permission to view employees.")
  }

  const supabase = await createClient()
  let query = supabase
    .from("employees")
    .select("id, first_name, last_name, employee_no")

  if (searchTerm) {
    query = query.or(
      `first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,employee_no.ilike.%${searchTerm}%`
    )
  }

  const { data, error } = await query.limit(20)
  if (error) throw new Error(error.message)

  return (data || []).map((item) => ({
    value: String(item.id),
    label: `${item.first_name} ${item.last_name} (${item.employee_no})`,
  }))
}
