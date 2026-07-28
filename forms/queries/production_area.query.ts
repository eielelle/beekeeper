import { toast } from "sonner"
import {
  fetchProductionAreasAction,
  getProductionAreaAction,
  createProductionAreaAction,
  updateProductionAreaAction,
  deleteProductionAreaAction,
  searchProductionAreasAction,
} from "@/actions/production_area.action"

export type ProductionAreaStoreType = {
  id?: string
  area_code: string
  area_name: string
  area_description?: string
  org_id?: number
  created_at?: string
}

export type FetchProductionAreasParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchProductionAreas(params: FetchProductionAreasParams) {
  const t = toast.loading("Fetching Production Areas. Please wait.")
  try {
    const response = await fetchProductionAreasAction(params)
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

export async function getProductionArea(id: string) {
  const t = toast.loading("Fetching Production Area. Please wait.")
  try {
    const data = await getProductionAreaAction(id)
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

export async function createProductionArea(value: ProductionAreaStoreType) {
  const t = toast.loading("Creating Production Area. Please wait.")
  try {
    const data = await createProductionAreaAction(value)
    toast.dismiss(t)
    toast.success("Production Area successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateProductionArea(value: ProductionAreaStoreType) {
  const t = toast.loading("Updating Production Area. Please wait.")
  try {
    const data = await updateProductionAreaAction(value)
    toast.dismiss(t)
    toast.success("Production Area successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteProductionArea(id: string) {
  const t = toast.loading("Deleting Production Area. Please wait.")
  try {
    const data = await deleteProductionAreaAction(id)
    toast.dismiss(t)
    toast.success("Production Area successfully deleted.")
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
 * Lightweight search function without loading toasts, designed for Combobox inputs.
 */
export async function searchProductionAreas(searchQuery: string = "") {
  try {
    return await searchProductionAreasAction(searchQuery)
  } catch (error: unknown) {
    console.error("Error searching production areas:", error)
    return []
  }
}
