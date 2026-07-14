import * as z from "zod"

export const employeeSchema = z.object({
  employee_no: z.string().min(1, "Employee number is required").max(50),
  first_name: z.string().min(1, "First name is required").max(100),
  middle_name: z.string().or(z.literal("")),
  last_name: z.string().min(1, "Last name is required").max(100),
  email: z.string().email("Invalid email format").or(z.literal("")),
  phone: z.string().or(z.literal("")),
})
