import { toast } from "sonner"
import {
  fetchProductionPipelinesAction,
  getProductionPipelineAction,
  createProductionPipelineAction,
  updateProductionPipelineAction,
  deleteProductionPipelineAction,
} from "@/actions/production-pipeline.action"
import { FetchParams } from "@/types/fetch-params"
import { ProductionPipelineFormValues } from "@/forms/schemas/production-pipeline.schema"

export type ProductionPipelineType = {
  id?: string
  name: string
  description?: string | null
  department_id?: number | string
  org_id?: number
  created_at?: string
  // Add the steps array here:
  steps?: {
    id: number
    step_name: string
    step_order: number
    depends_on_step_id?: number | null
  }[]
  // Relational data for the Data Table view
  department?: { name: string; code: string } | null
}

export async function fetchProductionPipelines(params: FetchParams) {
  const t = toast.loading("Fetching Production Pipelines. Please wait.")
  try {
    const response = await fetchProductionPipelinesAction(params)
    toast.dismiss(t)
    return response
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function getProductionPipeline(id: string) {
  const t = toast.loading("Fetching Pipeline. Please wait.")
  try {
    const data = await getProductionPipelineAction(id)
    toast.dismiss(t)
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// Note: department_id is omitted here because it is injected by the Server Action
export async function createProductionPipeline(
  value: ProductionPipelineFormValues
) {
  const t = toast.loading("Creating Pipeline. Please wait.")
  try {
    const data = await createProductionPipelineAction(value)
    toast.dismiss(t)
    toast.success("Pipeline successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateProductionPipeline(
  value: ProductionPipelineFormValues & { id: string }
) {
  const t = toast.loading("Updating Pipeline. Please wait.")
  try {
    const data = await updateProductionPipelineAction(value)
    toast.dismiss(t)
    toast.success("Pipeline successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteProductionPipeline(id: string) {
  const t = toast.loading("Deleting Pipeline. Please wait.")
  try {
    const data = await deleteProductionPipelineAction(id)
    toast.dismiss(t)
    toast.success("Pipeline successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
