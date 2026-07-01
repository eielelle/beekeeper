import * as z from "zod"

export const employeeSchema = z.object({
  employee_no: z.string().max(20).min(1, "Employee No. is required"),
  first_name: z.string().max(60).min(1, "First Name is required"),
  last_name: z.string().max(60).min(1, "Last Name is required"),
  email: z.email("Invalid email"),
  phone: z.string().max(11).min(1, "Phone number is required"),
  gender: z.enum(
    ["Male", "Female", "Non-Binary", "Prefer not to say"],
    "Gender is required"
  ),
  //   employment_start: z
  //     .date()
  //     .max(new Date(), "Start date cannot be in the future")
  //     .nullable(),
  //   employment_end: z.date().optional().nullable(),
  team: z.string().max(60).min(1),
  agency: z.string().max(60),
  reports_to: z.string().max(120),
  is_superuser: z.boolean(),
})
