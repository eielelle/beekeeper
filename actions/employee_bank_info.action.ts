"use server"

import { createClient } from "@/lib/supabase/server"
import { getServerAbility } from "@/lib/casl/server"
import { subject } from "@casl/ability"
import {
  BankEmployeeFormValues,
  employeeBankSchema,
} from "@/forms/schemas/employee_bank_info.schema"

// ==========================================
// 1. GET BANK ACCOUNTS
// ==========================================
export async function getEmployeeBanksAction(employeeId: string | number) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (
    ability.cannot(
      "read",
      subject("employees", { employee_id: employeeId }) // Check read access on employee
    )
  ) {
    throw new Error(
      "Forbidden: You do not have permissions to view this employee's bank information."
    )
  }

  const { data, error } = await supabase
    .from("employee_bank_accounts")
    .select("*")
    .eq("employee_id", employeeId)

  if (error) {
    throw new Error(error.message)
  }

  // Format array to match Zod schema expectation
  const mappedData: BankEmployeeFormValues = {
    banks: (data || []).map((bank) => ({
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      account_type: bank.account_type as "Savings" | "Checking",
      branch_code: bank.branch_code || "",
      is_primary: bank.is_primary ?? false,
    })),
  }

  return mappedData
}

// ==========================================
// 2. UPSERT BANK ACCOUNTS
// ==========================================
export async function upsertEmployeeBanksAction(
  employeeId: string | number,
  value: BankEmployeeFormValues
) {
  const ability = await getServerAbility()
  const supabase = await createClient()

  if (
    ability.cannot("update", subject("employees", { employee_id: employeeId }))
  ) {
    throw new Error(
      "Forbidden: You do not have permissions to modify this employee's bank information."
    )
  }

  const validatedFields = employeeBankSchema.safeParse(value)
  if (!validatedFields.success) {
    throw new Error("Validation failed. Please check form errors.")
  }

  const parsedValue = validatedFields.data

  // 1. Delete existing bank accounts for this employee
  const { error: deleteError } = await supabase
    .from("employee_bank_accounts")
    .delete()
    .eq("employee_id", employeeId)

  if (deleteError) throw new Error(deleteError.message)

  // 2. Insert the new ones (if any)
  if (parsedValue.banks && parsedValue.banks.length > 0) {
    const banksToInsert = parsedValue.banks.map((bank) => ({
      employee_id: Number(employeeId),
      bank_name: bank.bank_name,
      account_number: bank.account_number,
      account_type: bank.account_type,
      branch_code: bank.branch_code || null,
      is_primary: bank.is_primary,
    }))

    const { error: insertError } = await supabase
      .from("employee_bank_accounts")
      .insert(banksToInsert)

    if (insertError) throw new Error(insertError.message)
  }

  return true
}
