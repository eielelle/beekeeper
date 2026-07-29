import * as z from "zod"

export const departmentSchema = z.object({
  name: z.string().min(1, "This field is required").max(100),
  code: z.string().min(1, "This field is required").max(20),
  department_head_id: z.string().optional().nullable(),
})
