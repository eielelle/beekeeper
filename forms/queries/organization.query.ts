import { toast } from "sonner"
import {
  fetchAllOrganizationsAction,
  fetchOrganizationsAction,
  getOrganizationAction,
  createOrganizationAction,
  updateOrganizationAction,
  deleteOrganizationAction,
} from "@/actions/organization.action"

export type OrganizationStoreType = {
  id?: string
  organization_name: string
  organization_code: string
  created_at?: string
}

export type FetchOrganizationsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchAllOrganizations() {
  try {
    return await fetchAllOrganizationsAction()
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function fetchOrganizations(params: FetchOrganizationsParams) {
  const t = toast.loading("Fetching Organizations. Please wait.")
  try {
    const response = await fetchOrganizationsAction(params)
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

export async function getOrganization(id: string) {
  const t = toast.loading("Fetching Organization. Please wait.")
  try {
    const data = await getOrganizationAction(id)
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

export async function createOrganization(value: OrganizationStoreType) {
  const t = toast.loading("Creating Organization. Please wait.")
  try {
    const data = await createOrganizationAction(value)
    toast.dismiss(t)
    toast.success("Organization successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function updateOrganization(value: OrganizationStoreType) {
  const t = toast.loading("Updating Organization. Please wait.")
  try {
    const data = await updateOrganizationAction(value)
    toast.dismiss(t)
    toast.success("Organization successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export async function deleteOrganization(id: string) {
  const t = toast.loading("Deleting Organization. Please wait.")
  try {
    const data = await deleteOrganizationAction(id)
    toast.dismiss(t)
    toast.success("Organization successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}
