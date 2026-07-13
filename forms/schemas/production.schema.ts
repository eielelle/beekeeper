import * as z from "zod"

export const productionSchema = z.object({
  production_date: z.string().min(1, "Production date is required"),
  production_area: z.string().min(1, "Please select a production area"),
  production_line: z.string().min(1, "Please select a production line"),
  shift: z.enum(["day", "night"], {
    required_error: "Please select a shift",
  }),
  operation_type: z.enum(["startup", "last_prod", "regular"], {
    required_error: "Please select an operation type",
  }),
})

export type ProductionFormValues = z.infer<typeof productionSchema>
