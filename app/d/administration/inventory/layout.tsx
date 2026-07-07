"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  Building2,
  Folder,
  Lock,
  ShoppingBag,
  Smartphone,
  Users2,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname()

  // Helper to determine which tab value matches the current URL path
  const getActiveTab = () => {
    if (pathname.endsWith("/inventory")) return "master-data"
    return "skus"
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
          <TabsTrigger value="master-data" asChild>
            <Link
              href="/d/administration/inventory"
              className="flex items-center gap-2"
            >
              <Folder className="h-4 w-4" /> Master Data
            </Link>
          </TabsTrigger>
          <TabsTrigger value="skus" asChild>
            <Link
              href="/d/administration/inventory/skus"
              className="flex items-center gap-2"
            >
              <ShoppingBag /> SKUs
            </Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* The sub-page content renders directly below the tab bar */}
      <div className="mt-4">{children}</div>
    </section>
  )
}
