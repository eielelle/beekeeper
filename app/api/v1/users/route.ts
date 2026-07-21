import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // 1. Get logged-in Auth User
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 2. Check if creator is authorized (Now checking securely by user_id!)
    const { data: creatorEmployee, error: employeeCheckError } = await supabase
      .from("employees")
      .select("is_superuser, org_id")
      .eq("user_id", user.id) // <-- SECURE LOOKUP
      .single()

    if (
      employeeCheckError ||
      !creatorEmployee ||
      creatorEmployee.is_superuser !== true
    ) {
      return NextResponse.json(
        { error: "Only superusers can create users" },
        { status: 403 }
      )
    }

    if (!creatorEmployee.org_id) {
      return NextResponse.json(
        { error: "Creator has no organization assigned" },
        { status: 400 }
      )
    }

    const body = await req.json()

    // 3. Extract fields
    const {
      employee_no,
      first_name,
      middle_name,
      last_name,
      email,
      phone,
      password,
      gender,
      birthdate,
      employment_start,
      is_superuser,
      avatar_url,
    } = body

    if (!employee_no || !first_name || !last_name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // 4. Create the Supabase Auth Account
    const { data: authUser, error: authErrorCreate } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      })

    if (authErrorCreate) {
      return NextResponse.json(
        { error: authErrorCreate.message },
        { status: 400 }
      )
    }

    // 5. Insert into the `employees` table WITH the user_id
    const { data: employee, error: employeeError } = await supabaseAdmin
      .from("employees")
      .insert({
        user_id: authUser.user.id, // <-- LINKING THE ACCOUNTS
        employee_no,
        first_name,
        middle_name,
        last_name,
        email,
        phone,
        gender,
        birthdate,
        employment_start,
        is_superuser: is_superuser || false,
        avatar_url,
        org_id: creatorEmployee.org_id,
      })
      .select()
      .single()

    // 6. Rollback if DB insert fails
    if (employeeError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
      return NextResponse.json(
        { error: employeeError.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { message: "User created successfully", employee },
      { status: 201 }
    )
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: Request) {
  try {
    // Extract the ID from the URL (e.g., /api/v1/users?id=123)
    const { searchParams } = new URL(req.url)
    const employeeId = searchParams.get("id")

    if (!employeeId) {
      return NextResponse.json(
        { error: "Employee ID is required." },
        { status: 400 }
      )
    }

    // 1. Find the employee to get their Auth user_id
    const { data: employee, error: fetchError } = await supabaseAdmin
      .from("employees")
      .select("user_id")
      .eq("id", employeeId)
      .single()

    if (fetchError || !employee) {
      return NextResponse.json(
        { error: "Employee not found." },
        { status: 404 }
      )
    }

    const authUserId = employee.user_id

    // 2. If they have an associated Auth account, delete it using the Admin API
    if (authUserId) {
      const { error: authError } =
        await supabaseAdmin.auth.admin.deleteUser(authUserId)

      if (authError) {
        return NextResponse.json(
          { error: `Auth Error: ${authError.message}` },
          { status: 500 }
        )
      }
    }

    // 3. Delete the employee record from the public.employees table
    const { error: dbError } = await supabaseAdmin
      .from("employees")
      .delete()
      .eq("id", employeeId)

    if (dbError) {
      return NextResponse.json(
        { error: `Database Error: ${dbError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: "Employee and Auth account deleted." },
      { status: 200 }
    )
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 }
    )
  }
}
