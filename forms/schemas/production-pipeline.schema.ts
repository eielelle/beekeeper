import * as z from "zod"

export const productionPipelineStepSchema = z.object({
  id: z.any().optional(),
  uid: z.string(),
  step_name: z.string().min(1, { message: "Step name cannot be empty." }),
})

export const productionPipelineSchema = z.object({
  name: z.string().min(1, { message: "Pipeline name is required." }),
  description: z.string().max(500).or(z.literal("")),
  department_id: z.string().min(1, { message: "Department is required." }),
  steps: z
    .array(productionPipelineStepSchema)
    .min(1, { message: "At least one step is required." }),
})

export type ProductionPipelineFormValues = z.infer<
  typeof productionPipelineSchema
>
export type ProductionPipelineStepValue = z.infer<
  typeof productionPipelineStepSchema
>
