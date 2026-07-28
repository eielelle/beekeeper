import { toast } from "sonner"
import { ProductionFormValues } from "../schemas/production.schema"
import {
  checkExistingProductionAction,
  fetchFilteredProductionsAction,
  getProductionAction,
  createProductionAction,
  updateProductionAction,
  deleteProductionAction,
} from "@/actions/production.action"

export type ProductionStoreType = {
  id?: string
  production_date: string
  production_area_id: string
  production_line_id: string
  shift: "day" | "night"
  operation_type: "startup" | "last_prod" | "regular"
  created_at?: string
}

export type FetchProductionsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export type ProductionFilters = {
  dateFrom?: string
  dateTo?: string
  production_area_id?: number | string
  production_line_id?: number | string
  shift?: "day" | "night" | "all"
  operation_type?: "startup" | "last_prod" | "regular" | "all"
}

type CheckProductionParams = {
  production_date: string
  production_area_id: string
  production_line_id: string
  shift: string
  operation_type: string
}

export type UpdateProductionPayload = ProductionFormValues & { id: string }

// --------------------------------------------------------
// FETCH QUERIES
// --------------------------------------------------------
export async function checkExistingProduction(params: CheckProductionParams) {
  try {
    return await checkExistingProductionAction(params)
  } catch (error) {
    console.error("Failed to check existing production:", error)
    return null
  }
}

export async function fetchFilteredProductions(filters: ProductionFilters) {
  try {
    return await fetchFilteredProductionsAction(filters)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function getProduction(id: string) {
  const t = toast.loading("Fetching Production. Please wait.")
  try {
    const data = await getProductionAction(id)
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

// --------------------------------------------------------
// MUTATIONS
// --------------------------------------------------------
export async function createProduction(value: ProductionFormValues) {
  const t = toast.loading("Creating Production record. Please wait.")
  try {
    const data = await createProductionAction(value)
    toast.dismiss(t)
    toast.success("Production record successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateProduction(value: UpdateProductionPayload) {
  const t = toast.loading("Updating Production record. Please wait.")
  try {
    const data = await updateProductionAction(value)
    toast.dismiss(t)
    toast.success("Production record successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteProduction(id: string) {
  const t = toast.loading("Deleting Production record. Please wait.")
  try {
    const data = await deleteProductionAction(id)
    toast.dismiss(t)
    toast.success("Production record successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
