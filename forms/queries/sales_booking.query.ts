import { supabase } from "@/lib/supabase"
import { SalesBookingFormValues } from "@/forms/schemas/sales_booking.schema"

export type SalesBookingRecord = {
  id: string
  booking_date: string
  status: string
  notes: string | null
  outlet_name: string
  outlet_code: string
  employee: {
    first_name: string | null
    last_name: string | null
    employee_no: string | null
  } | null
  items: {
    qty: number
    is_sample: boolean
  }[]
}

export type FetchBookingsParams = {
  pageIndex: number
  pageSize: number
  globalFilter?: string
}

// --- TYPES ---
export type SKU = {
  id: number
  sku_code: string
  item_name: string
  sku_url: string | null
  category: { category_name: string } | null
  brand: { brand_name: string } | null
  uom: { uom_name: string } | null
}

export type Outlet = {
  id: number
  outlet_name: string
  outlet_code: string
  address: string | null
  region: string | null
  province: string | null
  city: string | null
  barangay: string | null
  lat: number | null
  long: number | null
  distributor?: { outlet_name: string } | null
}

export type CartItem = SKU & {
  qty: number
  is_sample: boolean
}

// --- FETCH FUNCTIONS ---
export async function fetchCatalog() {
  const { data, error } = await supabase.from("skus").select(`
      id, sku_code, item_name, sku_url,
      category:sku_categories(category_name),
      brand:sku_brands(brand_name),
      uom:sku_uoms(uom_name)
    `)
  if (error) throw new Error(error.message)
  return data as unknown as SKU[]
}

// Updated to accept a search term for the combobox debounce
export async function fetchOutlets(search?: string) {
  let query = supabase
    .from("outlets")
    .select(
      `
      id, 
      outlet_name, 
      outlet_code, 
      address, 
      region, 
      province, 
      city, 
      barangay, 
      lat, 
      long,
      distributor:distributor_id(outlet_name)
    `
    )
    .eq("is_active", true)

  if (search && search.trim() !== "") {
    query = query.or(
      `outlet_name.ilike.%${search}%,outlet_code.ilike.%${search}%`
    )
  }

  const { data, error } = await query.limit(20) // Limit search results for performance

  if (error) throw new Error(error.message)
  return data as unknown as Outlet[]
}

// --- MUTATION FUNCTION ---
export async function createSalesBooking({
  values,
  cart,
  employeeId,
  selectedOutlet,
}: {
  values: SalesBookingFormValues
  cart: CartItem[]
  employeeId: number
  selectedOutlet: Outlet
}) {
  if (cart.length === 0) throw new Error("Cart is empty.")

  // 1. Insert Sales Booking Header
  const { data: booking, error: bookingError } = await supabase
    .from("sales_bookings")
    .insert({
      employee_id: employeeId,
      outlet_id: selectedOutlet.id,
      outlet_name: selectedOutlet.outlet_name,
      outlet_code: selectedOutlet.outlet_code,
      outlet_address: selectedOutlet.address,
      outlet_region: selectedOutlet.region,
      outlet_province: selectedOutlet.province,
      outlet_city: selectedOutlet.city,
      outlet_barangay: selectedOutlet.barangay,
      outlet_lat: selectedOutlet.lat,
      outlet_long: selectedOutlet.long,
      notes: values.notes || null,
      status: "pending",
    })
    .select()
    .single()

  if (bookingError) throw new Error(`Booking Error: ${bookingError.message}`)

  // 2. Prepare items for insertion (including is_sample flag)
  const itemsToInsert = cart.map((item) => ({
    sales_booking_id: booking.id,
    sku_id: item.id,
    sku_code: item.sku_code,
    item_name: item.item_name,
    category_name: item.category?.category_name || null,
    brand_name: item.brand?.brand_name || null,
    uom_name: item.uom?.uom_name || null,
    qty: item.qty,
    is_sample: item.is_sample,
  }))

  // 3. Insert Items
  const { error: itemsError } = await supabase
    .from("sales_booking_items")
    .insert(itemsToInsert)

  if (itemsError) throw new Error(`Items Error: ${itemsError.message}`)

  return booking
}

export async function fetchSalesBookings({
  pageIndex,
  pageSize,
  globalFilter,
}: FetchBookingsParams) {
  let query = supabase.from("sales_bookings").select(
    `
      id,
      booking_date,
      status,
      notes,
      outlet_name,
      outlet_code,
      employee:employees!employee_id(first_name, last_name, employee_no),
      items:sales_booking_items(qty, is_sample)
    `,
    { count: "exact" }
  )

  // Search by outlet name or code
  if (globalFilter) {
    query = query.or(
      `outlet_name.ilike.%${globalFilter}%,outlet_code.ilike.%${globalFilter}%`
    )
  }

  // Sort newest first
  query = query.order("booking_date", { ascending: false })

  // Pagination
  const from = pageIndex * pageSize
  const to = from + pageSize - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw new Error(error.message)

  return {
    data: data as unknown as SalesBookingRecord[],
    rowCount: count || 0,
  }
}

// --- Add to forms/queries/sales_booking.query.ts ---

export async function fetchSalesBookingById(id: string) {
  const { data, error } = await supabase
    .from("sales_bookings")
    .select(
      `
      *,
      employee:employees!employee_id(first_name, last_name, employee_no),
      items:sales_booking_items(*)
    `
    )
    .eq("id", id)
    .single()

  if (error) throw new Error(error.message)
  return data
}
