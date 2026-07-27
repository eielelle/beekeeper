import { toast } from "sonner"
import {
  fetchSkuBrandsAction,
  getSkuBrandAction,
  createSkuBrandAction,
  updateSkuBrandAction,
  deleteSkuBrandAction,
} from "@/actions/sku_brand.action"

export type SkuBrandStoreType = {
  id?: string
  brand_name: string
  org_id?: number
  created_at?: string
}

export type FetchSkuBrandsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSkuBrands(params: FetchSkuBrandsParams) {
  const t = toast.loading("Fetching SKU Brands. Please wait.")
  try {
    const response = await fetchSkuBrandsAction(params)
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

export async function getSkuBrand(id: string) {
  const t = toast.loading("Fetching SKU Brand. Please wait.")
  try {
    const data = await getSkuBrandAction(id)
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

export async function createSkuBrand(value: SkuBrandStoreType) {
  const t = toast.loading("Creating SKU Brand. Please wait.")
  try {
    const data = await createSkuBrandAction(value)
    toast.dismiss(t)
    toast.success("SKU Brand successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateSkuBrand(value: SkuBrandStoreType) {
  const t = toast.loading("Updating SKU Brand. Please wait.")
  try {
    const data = await updateSkuBrandAction(value)
    toast.dismiss(t)
    toast.success("SKU Brand successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteSkuBrand(id: string) {
  const t = toast.loading("Deleting SKU Brand. Please wait.")
  try {
    const data = await deleteSkuBrandAction(id)
    toast.dismiss(t)
    toast.success("SKU Brand successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
