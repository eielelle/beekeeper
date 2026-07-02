import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase-server"
import { supabaseAdmin } from "@/lib/supabase-admin"
import { cookies, headers } from "next/headers"

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    // Get logged-in user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    console.log(user)
    const cookieStore = await cookies()
    const headerStore = await headers()

    console.log("COOKIES:", cookieStore.getAll())
    console.log("COOKIE HEADER:", headerStore.get("cookie"))

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get creator profile including company
    const { data: creatorProfile, error: profileCheckError } = await supabase
      .from("profiles")
      .select("superuser, company_id")
      .eq("user_id", user.id)
      .single()

    if (
      profileCheckError ||
      !creatorProfile ||
      creatorProfile.superuser !== true
    ) {
      return NextResponse.json(
        {
          error: "Only superusers can create users",
        },
        {
          status: 403,
        }
      )
    }

    if (!creatorProfile.company_id) {
      return NextResponse.json(
        {
          error: "Creator has no company assigned",
        },
        {
          status: 400,
        }
      )
    }

    const body = await req.json()

    const {
      employee_no,
      first_name,
      last_name,
      email,
      phone,
      gender,
      team_id,
      agency_id,
      employment_start,
      employment_end,
      password,
    } = body

    if (!employee_no || !email || !password || !gender || !employment_start) {
      return NextResponse.json(
        {
          error: "Missing required fields",
        },
        {
          status: 400,
        }
      )
    }

    // Create auth account
    const { data: authUser, error: authErrorCreate } =
      await supabaseAdmin.auth.admin.createUser({
        email,

        password,

        email_confirm: true,
      })

    if (authErrorCreate) {
      return NextResponse.json(
        {
          error: authErrorCreate.message,
        },
        {
          status: 400,
        }
      )
    }

    // Create profile using creator company_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        user_id: authUser.user.id,

        employee_no,

        first_name,

        last_name,

        email,

        phone,

        gender,

        team_id,

        agency_id,

        employment_start,

        employment_end,

        // automatically inherited
        company_id: creatorProfile.company_id,

        superuser: false,
      })
      .select()
      .single()

    if (profileError) {
      await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)

      return NextResponse.json(
        {
          error: profileError.message,
        },
        {
          status: 400,
        }
      )
    }

    return NextResponse.json(
      {
        message: "User created successfully",
        profile,
      },
      {
        status: 201,
      }
    )
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      {
        error: "Internal server error",
      },
      {
        status: 500,
      }
    )
  }
}
