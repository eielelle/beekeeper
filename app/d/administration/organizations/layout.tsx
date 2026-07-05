"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Building, Building2, Lock, Smartphone, Users2 } from "lucide-react"
import { ReactNode } from "react"

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <section>
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <Building /> Organizations
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <Lock /> Access Roles
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Building2 /> Agencies
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Users2 /> Teams
          </TabsTrigger>
          <TabsTrigger value="reports">
            <Smartphone /> Devices
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </section>
  )
}
