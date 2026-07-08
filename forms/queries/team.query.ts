import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

export type TeamStoreType = {
  id?: string
  team_name: string
  team_description?: string
  approver_user_id?: string
  organization_id?: number
  created_at?: string
}

export type FetchTeamsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
}

export async function fetchTeams({
  pageIndex,
  pageSize,
  globalFilter,
  sorting,
}: FetchTeamsParams) {
  const t = toast.loading("Fetching Teams. Please wait.")

  // 1. Base query setup with exact count for pagination controls
  let query = supabase.from("teams").select("*", { count: "exact" })

  // 2. Server-Side Global Filtering (ILIKE search on team_name text field)
  if (globalFilter) {
    query = query.ilike("team_name", `%${globalFilter}%`)
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

export async function getTeam(id: string) {
  const t = toast.loading("Fetching Team details. Please wait.")

  const { data, error } = await supabase
    .from("teams")
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

export async function createTeam(value: Partial<TeamStoreType>) {
  const t = toast.loading("Creating Team. Please wait.")

  const { data, error } = await supabase.from("teams").insert([value])

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Team successfully created.")

  return data
}

export async function updateTeam(value: Partial<TeamStoreType>) {
  const t = toast.loading("Updating Team. Please wait.")

  const { id, ...updates } = value

  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", id!)
    .select()

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Team successfully updated.")

  return data
}

export async function deleteTeam(id: string) {
  const t = toast.loading("Deleting Team. Please wait.")

  const { data, error } = await supabase.from("teams").delete().eq("id", id)

  toast.dismiss(t)

  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  toast.success("Team successfully deleted.")
  return data
}
