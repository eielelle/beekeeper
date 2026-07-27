import { toast } from "sonner"
import {
  fetchSkuUomsAction,
  getSkuUomAction,
  createSkuUomAction,
  updateSkuUomAction,
  deleteSkuUomAction,
} from "@/actions/sku_uom.action"

export type SkuUomStoreType = {
  id?: string
  uom_code: string
  uom_name: string
  org_id?: number
  created_at?: string
}

export type FetchSkuUomsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchSkuUoms(params: FetchSkuUomsParams) {
  const t = toast.loading("Fetching Units of Measurement. Please wait.")
  try {
    const response = await fetchSkuUomsAction(params)
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

export async function getSkuUom(id: string) {
  const t = toast.loading("Fetching Unit of Measurement. Please wait.")
  try {
    const data = await getSkuUomAction(id)
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

export async function createSkuUom(value: SkuUomStoreType) {
  const t = toast.loading("Creating Unit of Measurement. Please wait.")
  try {
    const data = await createSkuUomAction(value)
    toast.dismiss(t)
    toast.success("Unit of Measurement successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateSkuUom(value: SkuUomStoreType) {
  const t = toast.loading("Updating Unit of Measurement. Please wait.")
  try {
    const data = await updateSkuUomAction(value)
    toast.dismiss(t)
    toast.success("Unit of Measurement successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteSkuUom(id: string) {
  const t = toast.loading("Deleting Unit of Measurement. Please wait.")
  try {
    const data = await deleteSkuUomAction(id)
    toast.dismiss(t)
    toast.success("Unit of Measurement successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
