import { toast } from "sonner"
import {
  fetchSkusAction,
  getSkuAction,
  createSkuAction,
  updateSkuAction,
  deleteSkuAction,
  fetchSkuCategoriesOptionsAction,
  fetchSkuBrandsOptionsAction,
  fetchSkuUomsOptionsAction,
  searchSkusAction,
} from "@/actions/sku.action"

export type SkuStoreType = {
  id?: string | number
  created_at?: string
  org_id?: number
  sku_code: string
  item_name: string
  item_description?: string
  barcode?: string | null
  sku_category_id?: string | number | null
  brand_id?: string | number | null
  sku_uom_id?: string | number | null
  uom?: string // Flattened UOM helper property
  sku_categories?: { id?: number; category_name: string } | null
  sku_brands?: { id?: number; brand_name: string } | null
  sku_uoms?: { id?: number; uom_code: string; uom_name: string } | null
}

export type FetchSkusParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export type SkuFormValues = Omit<
  SkuStoreType,
  "id" | "created_at" | "sku_categories" | "sku_brands" | "sku_uoms" | "uom"
>

// --- Fetch All SKUs ---
export async function fetchSkus(params: FetchSkusParams) {
  try {
    return await fetchSkusAction(params)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// --- Fetch Single SKU ---
export async function getSku(id: string) {
  try {
    return await getSkuAction(id)
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

export const fetchSkuById = getSku

// --- Create SKU ---
export async function createSku(value: SkuFormValues) {
  const t = toast.loading("Creating SKU. Please wait...")
  try {
    const data = await createSkuAction(value)
    toast.dismiss(t)
    toast.success("SKU successfully created.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// --- Update SKU (Handles Overloaded Arguments) ---
export async function updateSku(
  idOrValue: string | SkuStoreType,
  values?: SkuFormValues
) {
  const t = toast.loading("Updating SKU. Please wait...")

  let id: string | number
  let updates: Partial<SkuStoreType>

  if (typeof idOrValue === "object" && idOrValue !== null) {
    const {
      id: valId,
      created_at,
      sku_categories,
      sku_brands,
      sku_uoms,
      uom,
      ...rest
    } = idOrValue
    id = valId!
    updates = rest
  } else {
    id = idOrValue as string
    updates = values!
  }

  try {
    const data = await updateSkuAction(id, updates)
    toast.dismiss(t)
    toast.success("SKU successfully updated.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// --- Delete SKU ---
export async function deleteSku(id: string) {
  const t = toast.loading("Deleting SKU. Please wait...")
  try {
    const data = await deleteSkuAction(id)
    toast.dismiss(t)
    toast.success("SKU successfully deleted.")
    return data
  } catch (error: unknown) {
    toast.dismiss(t)
    const message =
      error instanceof Error ? error.message : "An unknown error occurred"
    toast.error(`ERR: ${message}`)
    throw error
  }
}

// --- Dropdown Options Queries ---
export async function fetchSkuCategoriesOptions() {
  try {
    return await fetchSkuCategoriesOptionsAction()
  } catch (error) {
    return []
  }
}

export async function fetchSkuBrandsOptions() {
  try {
    return await fetchSkuBrandsOptionsAction()
  } catch (error) {
    return []
  }
}

export async function fetchSkuUomsOptions() {
  try {
    return await fetchSkuUomsOptionsAction()
  } catch (error) {
    return []
  }
}

// --- Search SKUs ---
export async function searchSkus(queryText: string = "", limit = 20) {
  try {
    return await searchSkusAction(queryText, limit)
  } catch (error: unknown) {
    console.error(error)
    return []
  }
}

// Aliases to match SkuForm imports
export const fetchCategoriesLookup = fetchSkuCategoriesOptions
export const fetchBrandsLookup = fetchSkuBrandsOptions
export const fetchUomsLookup = fetchSkuUomsOptions
