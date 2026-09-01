import * as z from "zod"

export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required"),
  account_number: z.string().min(5, "Account number is required"),
  account_type: z.enum(["Savings", "Checking"]),
  branch_code: z.string().optional(),
  is_primary: z.boolean(),
})

export const employeeBankSchema = z.object({
  banks: z.array(bankAccountSchema).optional(),
})

export type BankEmployeeFormValues = z.infer<typeof employeeBankSchema>
