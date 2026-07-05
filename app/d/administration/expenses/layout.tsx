"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Building,
  Building2,
  Folder,
  Lock,
  Smartphone,
  Users2,
} from "lucide-react"
import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <section>
      <Tabs defaultValue="overview">
        <TabsList variant="line">
          <TabsTrigger value="overview">
            <Folder /> Master Data
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </section>
  )
}
