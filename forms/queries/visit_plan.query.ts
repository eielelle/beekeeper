import { toast } from "sonner"
import { createVisitPlanAction } from "@/actions/visit_plan.action"
import { VisitPlanFormValues } from "@/forms/schemas/visit_plan.schema"

export async function createVisitPlan(value: VisitPlanFormValues) {
  const t = toast.loading("Creating visit plan...")
  try {
    const res = await createVisitPlanAction(value)
    toast.dismiss(t)
    toast.success("Visit plan created successfully.")
    return res
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
