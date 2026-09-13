import * as z from "zod"

export const productionPipelineStepSchema = z.object({
  id: z.any().optional(), // Real database ID (if editing existing steps)
  uid: z.string(), // Frontend tracking ID for drag-and-drop
  step_name: z.string().min(1, { message: "Step name cannot be empty." }),
})

export const productionPipelineSchema = z.object({
  name: z.string().min(1, { message: "Pipeline name is required." }),
  description: z.string().max(500).or(z.literal("")),
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
