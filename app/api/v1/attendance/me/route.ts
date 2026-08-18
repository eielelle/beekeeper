// app/api/attendance/me/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getApiAuth } from "@/lib/helpers/api-auth"
import { getServerAbility } from "@/lib/casl/server"

export async function GET(request: NextRequest) {
  try {
    // 1. Instantly get the initialized Supabase client and user from headers
    const { supabase, user, error: authError } = await getApiAuth()

    // 2. Ensure the request is authenticated
    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = user.id

    // 3. Enforce CASL Authorization
    // Pass the API Supabase client and userId so it doesn't fall back to SSR cookies
    const ability = await getServerAbility(supabase, userId)

    // Check if they are allowed to read attendances based on your CASL factory
    if (ability.cannot("read", "attendances")) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to read attendances" },
        { status: 403 }
      )
    }

    // 4. Fetch the employee record using the injected userId
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // 5. Extract pagination params cleanly using NextRequest's nextUrl
    const pageIndex = parseInt(
      request.nextUrl.searchParams.get("pageIndex") || "0"
    )
    const pageSize = parseInt(
      request.nextUrl.searchParams.get("pageSize") || "10"
    )
    const from = pageIndex * pageSize
    const to = from + pageSize - 1

    // 6. Fetch attendances with exact count
    const { data, error, count } = await supabase
      .from("attendances")
      .select(
        `
        id, time_in, time_out, time_in_lat, time_in_long, time_out_lat, time_out_long, 
        time_in_attachment, time_out_attachment, created_at
      `,
        { count: "exact" }
      )
      .eq("employee_id", employee.id)
      .order("created_at", { ascending: false })
      .range(from, to)

    if (error) throw error

    return NextResponse.json({ data: data || [], rowCount: count || 0 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
