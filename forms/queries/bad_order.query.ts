import { supabase } from "@/lib/supabase"
import { toast } from "sonner"

// ==========================================
// 1. TYPES
// ==========================================
export type BadOrderStoreType = {
  id?: string
  created_at?: string
  org_id?: number
  employee_id?: number
  outlet_id: number | string
  type: "for_disposal" | "return_to_wh" | string
  notes?: string | null

  // Approver Fields
  total_price?: number | null
  status?: string
  current_step?: number

  outlets?: {
    id: number | string
    outlet_code: string
    outlet_name: string
  } | null
  bad_orders_items?: {
    id: string
    sku_id: number | string
    qty: number
    return_count?: number | null
    expiration_date?: string | null
    reason: string
    skus?: {
      sku_code: string
      item_name: string
    }
  }[]

  approval_requests?: any[]
  approval_logs?: any[]
}

export type FetchBadOrdersParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
  sorting?: { id: string; desc: boolean }[]
  filters?: {
    dateFrom?: string
    dateTo?: string
    type?: string
  }
}

export type CreateBadOrderPayload = {
  outlet_id: number
  employee_id: number
  type: "for_disposal" | "return_to_wh"
  notes?: string | null
  total_price?: number | null
  items: {
    sku_id: number
    qty: number
    return_count?: number | null
    expiration_date?: string | null
    reason: string
  }[]
}

// ==========================================
// 2. HELPER: GET CURRENT EMPLOYEE
// ==========================================
async function getCurrentEmployeeId() {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from("employees")
    .select("id")
    .eq("user_id", user.id)
    .single()

  return data?.id || null
}

// ==========================================
// 3. FETCHERS FOR "MY" AND "ALL" PAGES
// ==========================================
export async function fetchMyBadOrders(params: FetchBadOrdersParams) {
  const empId = await getCurrentEmployeeId()
  if (!empId) throw new Error("Not authenticated")
  return fetchBadOrdersBase(params, empId)
}

export async function fetchAllBadOrders(params: FetchBadOrdersParams) {
  return fetchBadOrdersBase(params, null)
}

async function fetchBadOrdersBase(
  { pageIndex, pageSize, globalFilter, sorting, filters }: FetchBadOrdersParams,
  employeeId: number | null
) {
  const t = toast.loading("Fetching Bad Orders. Please wait.")

  // STEP 1: Fetch Bad Orders without joining approval_requests
  let query = supabase.from("bad_orders").select(
    `
      *,
      outlets ( id, outlet_code, outlet_name ),
      bad_orders_items ( id, qty, return_count )
    `,
    { count: "exact" }
  )

  if (employeeId) query = query.eq("employee_id", employeeId)
  if (globalFilter)
    query = query.or(
      `notes.ilike.%${globalFilter}%,type.ilike.%${globalFilter}%`
    )
  if (filters?.type) query = query.ilike("type", `%${filters.type}%`)

  if (filters?.dateFrom) {
    query = query.gte("created_at", new Date(filters.dateFrom).toISOString())
  }
  if (filters?.dateTo) {
    const toDate = new Date(filters.dateTo)
    toDate.setHours(23, 59, 59, 999)
    query = query.lte("created_at", toDate.toISOString())
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

  const { data: badOrders, error, count } = await query

  if (error) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  if (!badOrders || badOrders.length === 0) {
    toast.dismiss(t)
    return { data: [], rowCount: 0 }
  }

  // STEP 2: Fetch corresponding Approval Requests
  const orderIds = badOrders.map((bo) => bo.id)
  const { data: approvals } = await supabase
    .from("approval_requests")
    .select(
      `
      record_id,
      current_step,
      status,
      approval_logs (
        step_level,
        status,
        approver:employees ( first_name, last_name )
      )
    `
    )
    .eq("module", "bad_orders")
    .in("record_id", orderIds)

  toast.dismiss(t)

  // STEP 3: Merge them securely (TypeScript fixed)
  const formattedData = badOrders.map((order: any) => {
    // 1. Find the request, let it be undefined if not found
    const request = approvals?.find((a) => a.record_id === order.id)

    // 2. Use optional chaining (?.) to safely pull the values
    return {
      ...order,
      current_step: request?.current_step,
      approval_logs: request?.approval_logs || [],
    }
  })

  return {
    data: formattedData as BadOrderStoreType[],
    rowCount: count || 0,
  }
}

// ==========================================
// 4. STATS FETCHERS
// ==========================================
export async function fetchMyBadOrderStats() {
  const empId = await getCurrentEmployeeId()
  if (!empId) return { total: 0, pending: 0, rejected: 0 }
  return fetchBadOrderStatsBase(empId)
}

export async function fetchAllBadOrderStats() {
  return fetchBadOrderStatsBase(null)
}

async function fetchBadOrderStatsBase(employeeId: number | null) {
  let query = supabase.from("bad_orders").select("id", { count: "exact" })
  let pendingQuery = supabase
    .from("bad_orders")
    .select("id", { count: "exact" })
    .is("status", null)
  let rejectedQuery = supabase
    .from("bad_orders")
    .select("id", { count: "exact" })
    .eq("status", "rejected")

  if (employeeId) {
    query = query.eq("employee_id", employeeId)
    pendingQuery = pendingQuery.eq("employee_id", employeeId)
    rejectedQuery = rejectedQuery.eq("employee_id", employeeId)
  }

  const [totalRes, pendingRes, rejectedRes] = await Promise.all([
    query,
    pendingQuery,
    rejectedQuery,
  ])

  return {
    total: totalRes.count || 0,
    pending: pendingRes.count || 0,
    rejected: rejectedRes.count || 0,
  }
}

// ==========================================
// 5. GET SINGLE (Used by Approvers & Forms)
// ==========================================
export async function getBadOrder(id: string) {
  const t = toast.loading("Fetching Bad Order details. Please wait.")

  // Step 1: Get Record
  const { data: badOrder, error } = await supabase
    .from("bad_orders")
    .select(
      `
      *,
      outlets ( id, outlet_code, outlet_name ),
      bad_orders_items (
        id, sku_id, qty, return_count, expiration_date, reason,
        skus ( sku_code, item_name )
      )
    `
    )
    .eq("id", id)
    .single()

  if (error) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  // Step 2: Get Approval Workflow status
  const { data: approval } = await supabase
    .from("approval_requests")
    .select(
      `
      id, current_step, status,
      approval_logs ( step_level, status, approver:employees(first_name, last_name) )
    `
    )
    .eq("module", "bad_orders")
    .eq("record_id", id)
    .single()

  toast.dismiss(t)

  // Attach workflow manually
  return {
    ...badOrder,
    current_step: approval?.current_step,
    approval_requests: approval ? [approval] : [],
    approval_logs: approval?.approval_logs || [],
  }
}

// ==========================================
// 6. CREATE
// ==========================================
export async function createBadOrder(payload: CreateBadOrderPayload) {
  const t = toast.loading("Creating Bad Order. Please wait.")
  const { items, ...orderData } = payload

  const { data: order, error: orderError } = await supabase
    .from("bad_orders")
    .insert([orderData])
    .select()
    .single()

  if (orderError) {
    toast.dismiss(t)
    toast.error(`ERR: ${orderError.message}`)
    throw orderError
  }

  if (items && items.length > 0) {
    const insertItems = items.map((item) => ({
      bad_order_id: order.id,
      ...item,
    }))
    const { error: itemsError } = await supabase
      .from("bad_orders_items")
      .insert(insertItems)

    if (itemsError) {
      toast.dismiss(t)
      toast.error(`ERR: Failed to add items - ${itemsError.message}`)
      throw itemsError
    }
  }

  toast.dismiss(t)
  toast.success("Bad Order successfully created.")
  return order
}

// ==========================================
// 7. UPDATE (Used by Approvers to add Data)
// ==========================================
export async function updateBadOrder(
  id: string,
  payload: Partial<CreateBadOrderPayload>
) {
  const t = toast.loading("Updating Bad Order. Please wait.")
  const { items, ...orderUpdates } = payload

  const { error: orderError } = await supabase
    .from("bad_orders")
    .update(orderUpdates)
    .eq("id", id)

  if (orderError) {
    toast.dismiss(t)
    toast.error(`ERR: ${orderError.message}`)
    throw orderError
  }

  if (items) {
    await supabase.from("bad_orders_items").delete().eq("bad_order_id", id)
    if (items.length > 0) {
      const insertItems = items.map((item) => ({ bad_order_id: id, ...item }))
      await supabase.from("bad_orders_items").insert(insertItems)
    }
  }

  toast.dismiss(t)
  toast.success("Bad Order successfully updated.")
  return true
}

// ==========================================
// 8. DELETE & LOOKUPS
// ==========================================
export async function deleteBadOrder(id: string) {
  const t = toast.loading("Deleting Bad Order. Please wait.")
  const { data, error } = await supabase
    .from("bad_orders")
    .delete()
    .eq("id", id)

  toast.dismiss(t)
  if (error) {
    toast.error(`ERR: ${error.message}`)
    throw error
  }
  toast.success("Bad Order successfully deleted.")
  return data
}

export async function searchOutlets(queryText: string = "", limit = 20) {
  let query = supabase
    .from("outlets")
    .select("id, outlet_code, outlet_name")
    .order("outlet_name", { ascending: true })
    .limit(limit)
  if (queryText.trim())
    query = query.or(
      `outlet_code.ilike.%${queryText.trim()}%,outlet_name.ilike.%${queryText.trim()}%`
    )
  const { data, error } = await query
  if (error) throw error
  return data || []
}

export async function searchSkus(queryText: string = "", limit = 20) {
  let query = supabase
    .from("skus")
    .select("id, sku_code, item_name")
    .order("item_name", { ascending: true })
    .limit(limit)
  if (queryText.trim())
    query = query.or(
      `sku_code.ilike.%${queryText.trim()}%,item_name.ilike.%${queryText.trim()}%`
    )
  const { data, error } = await query
  if (error) throw error
  return data || []
}

// ==========================================
// 9. APPROVALS INBOX FETCH
// ==========================================
export async function fetchPendingBadOrderApprovals({
  pageIndex,
  pageSize,
  globalFilter,
}: FetchBadOrdersParams) {
  const t = toast.loading("Fetching Pending Approvals...")

  // Fetch only bad orders that are still pending
  let query = supabase
    .from("bad_orders")
    .select(
      `
      *,
      employee:employees!fk_bo_employee(first_name, last_name, email),
      outlets ( id, outlet_code, outlet_name ),
      bad_orders_items ( id, qty, return_count, reason, skus ( sku_code, item_name ) )
    `,
      { count: "exact" }
    )
    .eq("status", "pending")
    .order("created_at", { ascending: true })

  if (globalFilter) {
    query = query.or(
      `notes.ilike.%${globalFilter}%,type.ilike.%${globalFilter}%`
    )
  }

  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data: badOrders, error, count } = await query

  if (error) {
    toast.dismiss(t)
    toast.error(`ERR: ${error.message}`)
    throw error
  }

  if (!badOrders || badOrders.length === 0) {
    toast.dismiss(t)
    return { data: [], rowCount: 0 }
  }

  // Get corresponding active approval requests
  const orderIds = badOrders.map((bo) => bo.id)
  const { data: approvals } = await supabase
    .from("approval_requests")
    .select(
      `
      id, record_id, current_step, status,
      approval_logs ( step_level, status, approver:employees ( first_name, last_name ) )
    `
    )
    .eq("module", "bad_orders")
    .in("record_id", orderIds)

  toast.dismiss(t)

  const formattedData = badOrders.map((order: any) => {
    const request = approvals?.find((a) => a.record_id === order.id)
    return {
      ...order,
      request_id: request?.id, // We need this to trigger the approval action!
      current_step: request?.current_step,
      approval_logs: request?.approval_logs || [],
    }
  })

  return {
    data: formattedData,
    rowCount: count || 0,
  }
}
