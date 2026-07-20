import * as z from "zod"

export const employeeWorkInfoSchema = z.object({
  employee_id: z.coerce.number(),

  // Work Assignment
  employment_type_id: z.coerce.number().optional().or(z.literal(undefined)),
  employment_status_id: z.coerce.number().optional().or(z.literal(undefined)),
  work_type_id: z.string().uuid().optional().or(z.literal("")), // UUID in DB
  department_id: z.coerce.number().optional().or(z.literal(undefined)),
  position_id: z.coerce.number().optional().or(z.literal(undefined)),

  // Government IDs
  sss_no: z.string().optional().or(z.literal("")),
  tin_no: z.string().optional().or(z.literal("")),
  philhealth_no: z.string().optional().or(z.literal("")),
  pagibig_no: z.string().optional().or(z.literal("")),

  // Emergency Contact
  emergency_contact_name: z.string().optional().or(z.literal("")),
  emergency_contact_no: z.string().optional().or(z.literal("")),
  emergency_relation: z.string().optional().or(z.literal("")),

  // Flags
  allow_overtime: z.boolean().optional().default(false),
})
