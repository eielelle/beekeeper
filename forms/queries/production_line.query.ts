import { toast } from "sonner"
import {
  fetchProductionLinesAction,
  getProductionLineAction,
  createProductionLineAction,
  updateProductionLineAction,
  deleteProductionLineAction,
  searchProductionLinesAction,
} from "@/actions/production_line.action"

export type ProductionLineStoreType = {
  id?: string
  line_name: string
  line_description?: string
  org_id?: number
  created_at?: string
}

export type FetchProductionLinesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchProductionLines(params: FetchProductionLinesParams) {
  const t = toast.loading("Fetching Production Lines. Please wait.")
  try {
    const response = await fetchProductionLinesAction(params)
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

export async function getProductionLine(id: string) {
  const t = toast.loading("Fetching Production Line. Please wait.")
  try {
    const data = await getProductionLineAction(id)
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

export async function createProductionLine(value: ProductionLineStoreType) {
  const t = toast.loading("Creating Production Line. Please wait.")
  try {
    const data = await createProductionLineAction(value)
    toast.dismiss(t)
    toast.success("Production Line successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateProductionLine(value: ProductionLineStoreType) {
  const t = toast.loading("Updating Production Line. Please wait.")
  try {
    const data = await updateProductionLineAction(value)
    toast.dismiss(t)
    toast.success("Production Line successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteProductionLine(id: string) {
  const t = toast.loading("Deleting Production Line. Please wait.")
  try {
    const data = await deleteProductionLineAction(id)
    toast.dismiss(t)
    toast.success("Production Line successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

/**
 * Lightweight search function without loading toasts, designed for Select/Combobox inputs.
 */
export async function searchProductionLines(searchQuery: string = "") {
  try {
    return await searchProductionLinesAction(searchQuery)
  } catch (error: unknown) {
    console.error("Error searching production lines:", error)
    return []
  }
}
