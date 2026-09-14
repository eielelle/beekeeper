import * as z from "zod"

export const visitPlanItemSchema = z.object({
  uid: z.string(),
  outlet_id: z.string().min(1, { message: "Outlet is required." }),
  visit_type_id: z.string().min(1, { message: "Visit Type is required." }),
  start_date: z.string().min(1, { message: "Start date is required." }),
  end_date: z.string().min(1, { message: "End date is required." }),
  notes: z.string().optional().nullable(),
})

export const visitPlanSchema = z.object({
  title: z.string().min(1, { message: "Plan title is required." }),
  start_date: z.string().min(1, { message: "Start date is required." }),
  end_date: z.string().min(1, { message: "End date is required." }),
  remarks: z.string().optional().nullable(),
  visits: z
    .array(visitPlanItemSchema)
    .min(1, { message: "At least one visit is required." }),
})

export type VisitPlanFormValues = z.infer<typeof visitPlanSchema>
export type VisitPlanItemValue = z.infer<typeof visitPlanItemSchema>
