"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export interface TabItem {
  value: string
  label: string
  href?: string // Optional: If provided, renders as a Link for page navigation
}

interface ReusableTabsLayoutProps {
  tabs: TabItem[]
  children: ReactNode
  defaultValue?: string
  className?: string
}

export default function ReusableTabsLayout({
  tabs,
  children,
  defaultValue,
  className = "",
}: ReusableTabsLayoutProps) {
  const pathname = usePathname()

  // Auto-detect active tab based on current URL path if hrefs are provided
  const activeTabFromPath = tabs.find((tab) => tab.href === pathname)?.value
  const activeTab = activeTabFromPath || defaultValue || tabs[0]?.value

  return (
    <div className={`space-y-4 ${className}`}>
      <Tabs value={activeTab} className="w-full">
        <TabsList variant="line">
          {tabs.map((tab) => {
            const trigger = (
              <TabsTrigger key={tab.value} value={tab.value}>
                {tab.label}
              </TabsTrigger>
            )

            // If an href exists, wrap the trigger inside Next.js Link
            if (tab.href) {
              return (
                <Link key={tab.value} href={tab.href}>
                  {trigger}
                </Link>
              )
            }

            return trigger
          })}
        </TabsList>
      </Tabs>

      <main>{children}</main>
    </div>
  )
}
