// middleware.ts
import { createClient } from "@/lib/supabase-server"
import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request,
  })

  // Refresh the auth session and get the current user

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Protect all /d/* routes
  if (request.nextUrl.pathname.startsWith("/d") && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/a/signin" // change to your login route
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}
