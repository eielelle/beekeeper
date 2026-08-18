// app/api/attendance/time-out/route.ts
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

    // 2. Enforce CASL Authorization
    // Time out modifies an existing record, so we check 'update' access
    // Pass the injected API client and userId
    const ability = await getServerAbility(supabase, userId)

    if (ability.cannot("update", "attendances")) {
      return NextResponse.json(
        { error: "Forbidden: You do not have permission to time out." },
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

    // 4. Find the active attendance record (where time_out is null)
    const { data: activeRecord } = await supabase
      .from("attendances")
      .select("id")
      .eq("employee_id", employee.id)
      .is("time_out", null)
      .single()

    if (!activeRecord) {
      return NextResponse.json(
        { error: "No active Time In found." },
        { status: 400 }
      )
    }

    // 5. Get location/attachments from Flutter
    const body = await request.json()
    const { lat, long, attachment } = body

    // 6. Update with Time Out
    const { data, error } = await supabase
      .from("attendances")
      .update({
        time_out: new Date().toISOString(),
        time_out_lat: lat,
        time_out_long: long,
        time_out_attachment: attachment,
      })
      .eq("id", activeRecord.id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
