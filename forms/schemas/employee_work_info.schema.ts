import * as z from "zod"

export const employeeWorkInfoSchema = z.object({
  // --- 1-to-1 Relations (Employment Records) ---
  department_id: z.string().min(1, "Department is required"),
  job_position_id: z.string().min(1, "Job Position is required"),
  reports_to_id: z.string().optional(),

  employment_type_id: z.string().min(1, "Employment Type is required"),
  work_type_id: z.string().min(1, "Work Arrangement/Type is required"),
  employment_status_id: z.string().min(1, "Employment Status is required"),

  effective_start_date: z.string().date().optional().or(z.literal("")),

  // --- 1-to-1 Relations (Lifecycles / Dates) ---
  lifecycles: z
    .object({
      original_hire_date: z.string().date().optional().or(z.literal("")),
      current_hire_date: z.string().date().optional().or(z.literal("")),
      probation_end_date: z.string().date().optional().or(z.literal("")),
      regularization_date: z.string().date().optional().or(z.literal("")),
      contract_expiry_date: z.string().date().optional().or(z.literal("")),
    })
    .optional(),

  // --- 1-to-1 Relations (Statutory & Government IDs) ---
  statutory: z
    .object({
      sss_number: z
        .string()
        .regex(/^\d{2}-\d{7}-\d{1}$/, "Format: XX-XXXXXXX-X")
        .optional()
        .or(z.literal("")),
      tin: z
        .string()
        .regex(/^\d{3}-\d{3}-\d{3}-\d{3}$/, "Format: XXX-XXX-XXX-XXX")
        .optional()
        .or(z.literal("")),
      rdo_code: z.string().optional(),
      philhealth_number: z
        .string()
        .regex(/^\d{2}-\d{9}-\d{1}$/, "Format: XX-XXXXXXXXX-X")
        .optional()
        .or(z.literal("")),
      pagibig_number: z
        .string()
        .regex(/^\d{4}-\d{4}-\d{4}$/, "Format: XXXX-XXXX-XXXX")
        .optional()
        .or(z.literal("")),
      national_id: z.string().optional(),
    })
    .optional(),
})

export type EmployeeWorkFormValues = z.infer<typeof employeeWorkInfoSchema>
