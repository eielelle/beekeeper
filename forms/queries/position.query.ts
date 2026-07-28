import { toast } from "sonner"
import {
  fetchPositionsAction,
  getPositionAction,
  createPositionAction,
  updatePositionAction,
  deletePositionAction,
} from "@/actions/position.action"

export type PositionType = {
  id?: string
  title: string
  code?: string
  org_id?: number
  created_at?: string
}

export type FetchPositionsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchPositions(params: FetchPositionsParams) {
  const t = toast.loading("Fetching Positions. Please wait.")
  try {
    const response = await fetchPositionsAction(params)
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

export async function getPosition(id: string) {
  const t = toast.loading("Fetching Position. Please wait.")
  try {
    const data = await getPositionAction(id)
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

export async function createPosition(value: PositionType) {
  const t = toast.loading("Creating Position. Please wait.")
  try {
    const data = await createPositionAction(value)
    toast.dismiss(t)
    toast.success("Position successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updatePosition(value: PositionType) {
  const t = toast.loading("Updating Position. Please wait.")
  try {
    const data = await updatePositionAction(value)
    toast.dismiss(t)
    toast.success("Position successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deletePosition(id: string) {
  const t = toast.loading("Deleting Position. Please wait.")
  try {
    const data = await deletePositionAction(id)
    toast.dismiss(t)
    toast.success("Position successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
