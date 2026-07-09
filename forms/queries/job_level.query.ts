import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type JobLevelStoreType = {
  id?: string
  level_name: string
  rank: number
  org_id?: number
  created_at?: string
}

export type FetchJobLevelsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchJobLevels({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchJobLevelsParams) {
  const t = toast.loading("Fetching Job Levels. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("job_levels").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on level_name)
  if (globalFilter) {
    query = query.ilike("level_name", `%${globalFilter}%`)
  }

  // 3. Server-Side Sorting
  if (sorting && sorting.length > 0) {
    const sort = sorting[0] // Handling single column sorting
    query = query.order(sort.id, { ascending: !sort.desc })
  } else {
    // Default fallback sort
    query = query.order("created_at", { ascending: false })
  }

  // 4. Server-Side Pagination Range Calc
  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  // Return both data and the total exact count needed by the frontend pagination controls
  return {
    data: data || [],
    rowCount: count || 0,
  }
}

export async function getJobLevel(id: string) {
  const t = toast.loading("Fetching Job Level. Please wait.")

  const { data, error } = await supabase
    .from("job_levels")
    .select("*")
    .eq("id", id)
    .single()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  return data
}

export async function createJobLevel(value: JobLevelStoreType) {
  const t = toast.loading("Creating Job Level. Please wait.")

  const { data, error } = await supabase.from("job_levels").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Job Level successfully created.")

  return data
}

export async function updateJobLevel(value: JobLevelStoreType) {
  const t = toast.loading("Updating Job Level. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("job_levels")
    .update(updates)
    .eq("id", id)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Job Level successfully updated.")

  return data
}

export async function deleteJobLevel(id: string) {
  const t = toast.loading("Deleting Job Level. Please wait.")

  const { data, error } = await supabase
    .from("job_levels")
    .delete()
    .eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Job Level successfully deleted.")
  return data
}
