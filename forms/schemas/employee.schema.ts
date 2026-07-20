import * as z from "zod"

export const employeeSchema = z.object({
  employee_no: z.string().min(1, "Employee Number is required"),
  first_name: z.string().min(1, "First Name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last Name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),

  // New fields
  gender: z.string().optional(),
  employment_start: z.string().optional(),
  birthdate: z.string().optional(),
  is_superuser: z.boolean().catch(false), // Catches undefined and defaults to false
})
