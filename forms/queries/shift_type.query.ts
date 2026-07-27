import { toast } from "sonner"
import {
  fetchShiftTypesAction,
  getShiftTypeAction,
  createShiftTypeAction,
  updateShiftTypeAction,
  deleteShiftTypeAction,
} from "@/actions/shift_type.action"

export type ShiftTypeStoreType = {
  id?: string
  name: string
  start_time: string
  end_time: string
  org_id?: number
  created_at?: string
}

export type FetchShiftTypesParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchShiftTypes(params: FetchShiftTypesParams) {
  const t = toast.loading("Fetching Shift Types. Please wait.")
  try {
    const response = await fetchShiftTypesAction(params)
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

export async function getShiftType(id: string) {
  const t = toast.loading("Fetching Shift Type. Please wait.")
  try {
    const data = await getShiftTypeAction(id)
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

export async function createShiftType(value: ShiftTypeStoreType) {
  const t = toast.loading("Creating Shift Type. Please wait.")
  try {
    const data = await createShiftTypeAction(value)
    toast.dismiss(t)
    toast.success("Shift Type successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateShiftType(value: ShiftTypeStoreType) {
  const t = toast.loading("Updating Shift Type. Please wait.")
  try {
    const data = await updateShiftTypeAction(value)
    toast.dismiss(t)
    toast.success("Shift Type successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteShiftType(id: string) {
  const t = toast.loading("Deleting Shift Type. Please wait.")
  try {
    const data = await deleteShiftTypeAction(id)
    toast.dismiss(t)
    toast.success("Shift Type successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
