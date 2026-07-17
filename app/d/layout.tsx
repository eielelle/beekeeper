import { ReactNode } from "react"

import { AppSidebar } from "@/components/custom/sidebar/app-sidebar"
import { AppBreadcrumb } from "@/components/custom/breadcrumbs/app-breadcrumb"
import { Separator } from "@/components/ui/separator"

import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Bell } from "lucide-react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />

          <span className="text-xs">beekeeper</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild className="ml-auto">
              <Button variant={"ghost"} size={"icon-xs"} className="relative">
                <Bell className="h-5 w-5" />

                {/* Unread Indicator Dot */}
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
