import { supabase } from "@/lib/supabase"
import { ActiveUser } from "@/components/custom/maps/active-users-map"

export async function fetchDashboardData() {
  const today = new Date()
  const startOfToday = new Date(today.setHours(0, 0, 0, 0)).toISOString()
  const endOfToday = new Date(today.setHours(23, 59, 59, 999)).toISOString()

  const sevenDaysAgoDate = new Date()
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7)
  const sevenDaysAgo = sevenDaysAgoDate.toISOString()

  // 1. Fetch Header Stats
  const { count: employeeCount } = await supabase
    .from("employees")
    .select("*", { count: "exact", head: true })

  const { count: leaveCount } = await supabase
    .from("leaves")
    .select("*", { count: "exact", head: true })
    .eq("leave_date", today.toISOString().split("T")[0])

  // 2. Fetch Today's Attendances (For Map and Stats)
  const { data: attendances } = await supabase
    .from("attendances")
    .select(
      `
      id, time_in, time_out, time_in_lat, time_in_long,
      employee:employees(id, first_name, last_name, avatar_url)
    `
    )
    .gte("created_at", startOfToday)
    .lte("created_at", endOfToday)

  // 3. Fetch Sales Bookings (Last 7 Days for Analytics)
  const { data: sales } = await supabase
    .from("sales_bookings")
    .select(
      `
      id, booking_date, status,
      items:sales_booking_items(qty, subtotal, item_name)
    `
    )
    .gte("booking_date", sevenDaysAgo)

  // --- DATA PROCESSING ---

  // Attendance Stats
  const timeInCount =
    attendances?.filter((a) => a.time_in && !a.time_out).length || 0
  const timeOutCount = attendances?.filter((a) => a.time_out).length || 0

  // Map Data (Live Active Users)
  const activeUsers: ActiveUser[] = (attendances || [])
    .filter((a) => a.time_in_lat && a.time_in_long)
    .map((a: any) => ({
      id: a.employee.id.toString(),
      name: `${a.employee.first_name} ${a.employee.last_name}`,
      lat: a.time_in_lat,
      long: a.time_in_long,
      status: a.time_out ? "idle" : "online",
      avatarUrl: a.employee.avatar_url || undefined,
    }))

  // Sales Trend Aggregation (Group by Date)
  const salesMap = new Map<string, number>()
  const productMap = new Map<string, number>()

  sales?.forEach((booking) => {
    // Format date as "Jul 22"
    const date = new Date(booking.booking_date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })

    let dailyTotal = 0
    booking.items.forEach((item: any) => {
      // Sum totals for the bar chart
      dailyTotal += Number(item.subtotal || 0)

      // Sum quantities for the top products pie chart
      const currentQty = productMap.get(item.item_name) || 0
      productMap.set(item.item_name, currentQty + Number(item.qty))
    })

    salesMap.set(date, (salesMap.get(date) || 0) + dailyTotal)
  })

  // Format for Recharts
  const salesTrend = Array.from(salesMap, ([date, total]) => ({
    date,
    total,
  })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  const topProducts = Array.from(productMap, ([name, qty]) => ({ name, qty }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5) // Top 5 SKUs

  return {
    stats: {
      employees: employeeCount || 0,
      timeIn: timeInCount,
      timeOut: timeOutCount,
      leaves: leaveCount || 0,
    },
    activeUsers,
    salesTrend,
    topProducts,
  }
}
