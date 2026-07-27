import { toast } from "sonner"
import {
  fetchSkuCategoriesAction,
  getSkuCategoryAction,
  createSkuCategoryAction,
  updateSkuCategoryAction,
  deleteSkuCategoryAction,
} from "@/actions/sku_category.action"

export type SkuCategoryStoreType = {
  id?: string
  category_name: string
  category_description?: string
  org_id?: number
  created_at?: string
}

export type FetchSkuCategoriesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSkuCategories(params: FetchSkuCategoriesParams) {
  const t = toast.loading("Fetching SKU Categories. Please wait.")
  try {
    const response = await fetchSkuCategoriesAction(params)
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

export async function getSkuCategory(id: string) {
  const t = toast.loading("Fetching SKU Category. Please wait.")
  try {
    const data = await getSkuCategoryAction(id)
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

export async function createSkuCategory(value: SkuCategoryStoreType) {
  const t = toast.loading("Creating SKU Category. Please wait.")
  try {
    const data = await createSkuCategoryAction(value)
    toast.dismiss(t)
    toast.success("SKU Category successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateSkuCategory(value: SkuCategoryStoreType) {
  const t = toast.loading("Updating SKU Category. Please wait.")
  try {
    const data = await updateSkuCategoryAction(value)
    toast.dismiss(t)
    toast.success("SKU Category successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteSkuCategory(id: string) {
  const t = toast.loading("Deleting SKU Category. Please wait.")
  try {
    const data = await deleteSkuCategoryAction(id)
    toast.dismiss(t)
    toast.success("SKU Category successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
