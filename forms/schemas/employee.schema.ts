import * as z from "zod"

export const employeeSchema = z.object({
  first_name: z.string().min(1, "First name is required").max(100),
  last_name: z.string().min(1, "Last name is required").max(100),
  gender: z.string().min(1, "Gender selection is required").max(50),
})
