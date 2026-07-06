"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Building2, Lock, Smartphone, Users2 } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Helper to determine which tab value matches the current URL path
  const getActiveTab = () => {
    if (pathname.endsWith("/access-roles")) return "analytics" // matches your trigger value
    if (pathname.includes("/agencies")) return "agencies"
    if (pathname.endsWith("/teams")) return "reports-teams" // fixed duplicate values
    if (pathname.endsWith("/devices")) return "reports-devices"
    return "org" // default fallback (e.g., /dashboard)
  }

  return (
    <section className="space-y-4">
      {/* 
        We pass the current path-based value to the Tabs container.
        We don't need a value changer function because the <Link> updates the URL,
        which re-triggers usePathname() and updates this component.
      */}
      <Tabs value={getActiveTab()}>
        <TabsList variant="line">
          <TabsTrigger value="org" asChild>
            <Link
              href="/d/administration/organizations"
              className="flex items-center gap-2"
            >
              <Building className="h-4 w-4" /> Organizations
            </Link>
          </TabsTrigger>

          <TabsTrigger value="analytics" asChild>
            <Link
              href="/dashboard/access-roles"
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" /> Access Roles
            </Link>
          </TabsTrigger>

          <TabsTrigger value="agencies" asChild>
            <Link
              href="/d/administration/organizations/agencies"
              className="flex items-center gap-2"
            >
              <Building2 className="h-4 w-4" /> Agencies
            </Link>
          </TabsTrigger>

          <TabsTrigger value="reports-teams" asChild>
            <Link href="/dashboard/teams" className="flex items-center gap-2">
              <Users2 className="h-4 w-4" /> Teams
            </Link>
          </TabsTrigger>

          <TabsTrigger value="reports-devices" asChild>
            <Link href="/dashboard/devices" className="flex items-center gap-2">
              <Smartphone className="h-4 w-4" /> Devices
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* The sub-page content renders directly below the tab bar */}
      <div className="mt-4">{children}</div>
    </section>
  )
}
