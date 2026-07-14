import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

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
  // Exact relation shapes based on your query files
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

// --- Fetch All SKUs (Paginated & Sorted) ---
export async function fetchSkus({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchSkusParams) {
  let query = supabase.from("skus").select(
    `
      *,
      sku_categories ( id, category_name ),
      sku_brands ( id, brand_name ),
      sku_uoms ( id, uom_code, uom_name )
    `,
    { count: "exact" }
  )

  if (globalFilter) {
    query = query.or(
      `sku_code.ilike.%${globalFilter}%,item_name.ilike.%${globalFilter}%,barcode.ilike.%${globalFilter}%`
    )
  }

  if (sorting && sorting.length > 0) {
    const sort = sorting[0]
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    query = query.order("created_at", { ascending: false })
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  const formattedData: SkuStoreType[] = (data || []).map((item: any) => ({
    ...item,
    uom: item.sku_uoms?.uom_code ?? "",
  }))

  return {
    data: formattedData,
    rowCount: count || 0,
  }
}

// --- Fetch Single SKU ---
export async function getSku(id: string) {
  const { data, error } = await supabase
    .from("skus")
    .select(
      `
      *,
      sku_categories ( id, category_name ),
      sku_brands ( id, brand_name ),
      sku_uoms ( id, uom_code, uom_name )
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return {
    ...data,
    uom: data.sku_uoms?.uom_code ?? "",
  } as SkuStoreType
}

// Alias for getSku to support SkuForm imports
export const fetchSkuById = getSku

// --- Create SKU ---
export async function createSku(value: SkuFormValues) {
  const t = toast.loading("Creating SKU. Please wait...")

  const { data, error } = await supabase.from("skus").insert([value]).select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU successfully created.")
  return data
}

// --- Update SKU ---
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
    id = idOrValue
    updates = values!
  }

  const { data, error } = await supabase
    .from("skus")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU successfully updated.")
  return data
}

// --- Delete SKU ---
export async function deleteSku(id: string) {
  const t = toast.loading("Deleting SKU. Please wait...")

  const { data, error } = await supabase.from("skus").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("SKU successfully deleted.")
  return data
}

// --- Dropdown Options Queries ---
export async function fetchSkuCategoriesOptions() {
  const { data, error } = await supabase
    .from("sku_categories")
    .select("id, category_name")
    .order("category_name")

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data || []
}

export async function fetchSkuBrandsOptions() {
  const { data, error } = await supabase
    .from("sku_brands")
    .select("id, brand_name")
    .order("brand_name")

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data || []
}

export async function fetchSkuUomsOptions() {
  const { data, error } = await supabase
    .from("sku_uoms")
    .select("id, uom_code, uom_name")
    .order("uom_code")

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data || []
}

// --- Search SKUs (Used for Comboboxes/Lookups) ---
export async function searchSkus(queryText: string = "", limit = 20) {
  let query = supabase
    .from("skus")
    .select(
      `
      id,
      sku_code,
      item_name,
      barcode,
      sku_uoms ( uom_code )
    `
    )
    .order("sku_code", { ascending: true })
    .limit(limit)

  if (queryText.trim()) {
    query = query.or(
      `sku_code.ilike.%${queryText.trim()}%,item_name.ilike.%${queryText.trim()}%,barcode.ilike.%${queryText.trim()}%`
    )
  }

  const { data, error } = await query

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  // Format response so item.uom contains the uom_code string
  return ((data as any[]) || []).map((item) => ({
    ...item,
    uom: item.sku_uoms?.uom_code ?? "",
  })) as SkuStoreType[]
}

// Aliases to match SkuForm imports
export const fetchCategoriesLookup = fetchSkuCategoriesOptions
export const fetchBrandsLookup = fetchSkuBrandsOptions
export const fetchUomsLookup = fetchSkuUomsOptions
