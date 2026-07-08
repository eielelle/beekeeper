import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionBatchSubmission = {
  production_date: string
  production_area_id: string
  production_line_id: string
  is_day: boolean
  operation_type: string
  items: {
    sku_id: string
    qty: string
  }[]
}

export type FetchProductionSummaryParams = {
  pageIndex: number
  pageSize: number
  productionAreaId?: string
  productionLineId?: string
  dateFrom?: string
  dateTo?: string
  skuCode?: string
}

export async function submitProductionBatch(batch: ProductionBatchSubmission) {
  const t = toast.loading("Submitting production batch logs...")

  // Maps individual item quantities paired with their unique structural SKUs
  const databasePayload = batch.items.map((item) => ({
    production_date: batch.production_date,
    production_area_id: batch.production_area_id,
    production_line_id: batch.production_line_id,
    is_day: batch.is_day,
    operation_type: batch.operation_type,
    sku_id: item.sku_id,
    qty: item.qty,
  }))

  const { data, error } = await supabase
    .from("production")
    .insert(databasePayload)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`Submission Failure: ${error.message}`)
    throw error
  }

  toast.success(`Successfully logged ${databasePayload.length} batch items.`)
  return data
}

// 1. Fetch main paginated summary table
export async function fetchProductionSummaryReport({
  pageIndex,
  pageSize,
  productionAreaId,
  productionLineId,
  dateFrom,
  dateTo,
  skuCode,
}: FetchProductionSummaryParams) {
  let query = supabase.from("production").select(
    `
      id,
      production_date,
      is_day,
      operation_type,
      qty,
      production_areas (id, area_name, area_code),
      production_lines (id, line_name, line_code),
      skus (
        id, 
        sku_code, 
        item_name,
        sku_uoms (uom)
      )
    `,
    { count: "exact" }
  )

  // Server-Side Filters
  if (productionAreaId && productionAreaId !== "all") {
    query = query.eq("production_area_id", productionAreaId)
  }
  if (productionLineId && productionLineId !== "all") {
    query = query.eq("production_line_id", productionLineId)
  }
  if (dateFrom) {
    query = query.gte("production_date", dateFrom)
  }
  if (dateTo) {
    query = query.lte("production_date", dateTo)
  }
  if (skuCode) {
    query = query.ilike("skus.sku_code", `%${skuCode}%`)
  }

  // Server-Side Pagination Range
  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to).order("production_date", { ascending: false })

  const { data, error, count } = await query

  if (error) {
    toast.error(`Report Generation Failed: ${error.message}`)
    throw error
  }

  return {
    data: data || [],
    rowCount: count || 0,
  }
}

// 2. Fetch distinct production lines matched to current primary search filters
export async function fetchSummaryAvailableLines({
  productionAreaId,
  dateFrom,
  dateTo,
  skuCode,
}: Omit<
  FetchProductionSummaryParams,
  "pageIndex" | "pageSize" | "productionLineId"
>) {
  let query = supabase
    .from("production")
    .select(`production_lines (id, line_name)`)

  if (productionAreaId && productionAreaId !== "all") {
    query = query.eq("production_area_id", productionAreaId)
  }
  if (dateFrom) {
    query = query.gte("production_date", dateFrom)
  }
  if (dateTo) {
    query = query.lte("production_date", dateTo)
  }
  if (skuCode) {
    query = query.ilike("skus.sku_code", `%${skuCode}%`)
  }

  const { data, error } = await query

  if (error) return []

  const linesMap = new Map<string, string>()
  data?.forEach((row: any) => {
    if (row.production_lines?.id && row.production_lines?.line_name) {
      linesMap.set(row.production_lines.id, row.production_lines.line_name)
    }
  })

  return Array.from(linesMap.entries()).map(([id, name]) => ({ id, name }))
}
