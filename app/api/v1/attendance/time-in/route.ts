// app/api/attendance/time-in/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getApiAuth } from "@/lib/helpers/api-auth"
import { getServerAbility } from "@/lib/casl/server"

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate first to get the Supabase client and user ID from the Bearer token
    const { supabase, user, error: authError } = await getApiAuth()

    if (authError || !supabase || !user) {
      return NextResponse.json(
        { error: authError || "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = user.id

    // 2. Enforce CASL Authorization (Pass the API client and userId)
    const ability = await getServerAbility(supabase, userId)

    if (ability.cannot("create", "attendances")) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to time in." },
        { status: 403 }
      )
    }

    // 3. Fetch the employee record
    const { data: employee } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", userId)
      .single()

    if (!employee) {
      return NextResponse.json({ error: "Employee not found" }, { status: 404 })
    }

    // 4. Parse the request body
    const body = await request.json()
    const { lat, long, attachment } = body

    // 5. Insert the time-in record
    const { data, error } = await supabase
      .from("attendances")
      .insert([
        {
          employee_id: employee.id,
          time_in: new Date().toISOString(),
          time_in_lat: lat,
          time_in_long: long,
          time_in_attachment: attachment,
        },
      ])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
