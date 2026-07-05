import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type ProductionBatchSubmission = {
  production_date: string
  production_area_id: string
  production_line_id: string
  shift_type: string
  operation_type: string
  items: {
    sku_id: string
    qty: number
  }[]
}

export async function submitProductionBatch(batch: ProductionBatchSubmission) {
  const t = toast.loading("Submitting production batch logs...")

  // Maps individual item quantities paired with their unique structural SKUs
  const databasePayload = batch.items.map((item) => ({
    production_date: batch.production_date,
    production_area_id: batch.production_area_id,
    production_line_id: batch.production_line_id,
    shift_type: batch.shift_type,
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
