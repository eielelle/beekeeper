import { toast } from "sonner"
import {
  getEmployeeBanksAction,
  upsertEmployeeBanksAction,
} from "@/actions/employee_bank_info.action"
import { BankEmployeeFormValues } from "@/forms/schemas/employee_bank_info.schema"

// --- CRUD Operations ---

export async function getEmployeeBanks(employeeId: string | number) {
  try {
    return await getEmployeeBanksAction(employeeId)
  } catch (error: any) {
    toast.error(`ERR: ${error.message}`)
    return null
  }
}

export async function upsertEmployeeBanks(
  employeeId: string | number,
  value: BankEmployeeFormValues
) {
  const t = toast.loading("Saving bank accounts...")
  try {
    await upsertEmployeeBanksAction(employeeId, value)
    toast.dismiss(t)
    toast.success("Bank accounts successfully saved.")
    return true
  } catch (error: any) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }
}
