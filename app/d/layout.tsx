import { ReactNode } from "react"
import { redirect } from "next/navigation"

import { AppSidebar } from "@/components/custom/sidebar/app-sidebar"
import { AppBreadcrumb } from "@/components/custom/breadcrumbs/app-breadcrumb"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import { Bell } from "lucide-react"
import { createClient } from "@/lib/supabase-server"

export default async function DashboardLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/a/signin")
  }

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />

          <span className="text-xs">beekeeper</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="ml-auto">
              <Button variant="ghost" size="icon-xs" className="relative">
                <Bell className="h-5 w-5" />

                <span className="absolute top-2 right-2.5 h-2 w-2 rounded-full bg-red-600" />
                <span className="sr-only">Toggle notifications</span>
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>New message from Sarah</DropdownMenuItem>
              <DropdownMenuItem>
                Your deployment was successful
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4">
          <AppBreadcrumb />
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
