import * as z from "zod"

// 1. Define exported arrays
export const GENDER_OPTIONS = [
  "Male",
  "Female",
  "Other",
  "Prefer not to say",
] as const
export const CIVIL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Widowed",
  "Legally Separated",
] as const
export const ACCOUNT_STATUS_OPTIONS = [
  "Active",
  "Suspended",
  "Pending Activation",
] as const
export const EMPLOYMENT_TYPE_OPTIONS = [
  "Regular",
  "Probationary",
  "Project-Based",
  "Fixed-Term",
  "Casual",
] as const
export const BLOOD_TYPE_OPTIONS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
  "Unknown",
] as const

// ---------------------------------------------------------
// 1. RELATIONAL SCHEMAS (Sub-objects)
// ---------------------------------------------------------

export const addressSchema = z.object({
  full_address: z.string().min(1, "Full address is required"),
  street_unit: z.string().min(1, "Street is required"),
  barangay: z.string().min(1, "Barangay is required"),
  city: z.string().min(1, "City is required"),
  province: z.string().min(1, "Province is required"),
  region: z.string().min(1, "Region is required"),
  zip_code: z.string().min(4, "Invalid Zip Code"),
  is_active: z.boolean(),
})

export const bankAccountSchema = z.object({
  bank_name: z.string().min(1, "Bank name is required"),
  account_number: z.string().min(5, "Account number is required"),
  account_type: z.enum(["Savings", "Checking"]),
  branch_code: z.string().optional(),
  is_primary: z.boolean(),
})

export const emergencyContactSchema = z.object({
  full_name: z.string().min(1, "Name is required"),
  relationship: z.string().min(1, "Relationship is required"),
  mobile_number: z
    .string()
    .regex(/^(09|\+639)\d{9}$/, "Invalid PH Mobile Number"),
  is_primary: z.boolean(),
})

// ---------------------------------------------------------
// 2. MAIN EMPLOYEE SCHEMA
// ---------------------------------------------------------

export const employeeSchema = z.object({
  // --- Core Identity ---
  employee_no: z.string().min(1, "Employee Number is required"),
  first_name: z.string().min(1, "First Name is required"),
  middle_name: z.string().optional(),
  last_name: z.string().min(1, "Last Name is required"),
  maiden_name: z.string().optional(),
  suffix: z.string().optional(),
  nickname: z.string().optional(),

  // --- Demographics ---
  gender: z.enum(["Male", "Female", "Other", "Prefer not to say"]).optional(),
  civil_status: z
    .enum(["Single", "Married", "Widowed", "Legally Separated"])
    .optional(),
  date_of_birth: z
    .string()
    .date("Must be a valid date (YYYY-MM-DD)")
    .optional(),
  nationality: z.string(),
  blood_type: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "Unknown"])
    .optional(),

  // --- Contact Details ---
  work_email: z.string().email("Invalid work email address"),
  work_phone: z
    .string()
    .regex(/^(09|\+639)\d{9}$/, "Invalid PH Mobile Number")
    .optional()
    .or(z.literal("")),
  personal_email: z
    .string()
    .email("Invalid personal email")
    .optional()
    .or(z.literal("")),
  personal_mobile: z
    .string()
    .regex(/^(09|\+639)\d{9}$/, "Invalid PH Mobile Number")
    .optional()
    .or(z.literal("")),

  // --- System Access ---
  account_status: z.enum(["Active", "Suspended", "Pending Activation"]),
  role_id: z
    .string()
    .uuid("Invalid Role ID")
    .min(1, "Security Role is required"),

  // --- 1-to-1 Relations (Employment Records) ---
  employee_status: z.enum(["Hired", "Terminated", "Suspended", "Candidate"]),
  department_id: z.string().uuid("Department is required"),
  job_position_id: z.string().uuid("Job Position is required"),
  reports_to_id: z.string().uuid().optional(),
  employment_type: z.enum([
    "Regular",
    "Probationary",
    "Project-Based",
    "Fixed-Term",
    "Casual",
  ]),
  work_arrangement: z.enum(["On-site", "Hybrid", "WFH"]),
  effective_start_date: z.string().date(),

  // --- 1-to-1 Relations (Lifecycles / Dates) ---
  lifecycles: z.object({
    original_hire_date: z.string().date().optional(),
    current_hire_date: z.string().date().optional(),
    probation_end_date: z.string().date().optional(),
    regularization_date: z.string().date().optional(),
    contract_expiry_date: z.string().date().optional(),
  }),

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

  // --- Explicit Address Objects ---
  present_address: addressSchema,
  permanent_address: addressSchema.optional(), // Made optional so users can skip if same as present

  // --- 1-to-Many Relations (Arrays) ---
  emergency_contacts: z
    .array(emergencyContactSchema)
    .min(1, "At least one emergency contact is required"),
  banks: z.array(bankAccountSchema).optional(),
})

export type EmployeeFormValues = z.infer<typeof employeeSchema>
