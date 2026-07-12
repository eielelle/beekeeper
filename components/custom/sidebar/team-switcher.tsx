"use client"

import * as React from "react"
import { ChevronsUpDown, Loader } from "lucide-react"
import { useQuery } from "@tanstack/react-query"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { fetchAllOrganizations } from "@/forms/queries/organization.query"
import { Skeleton } from "@/components/ui/skeleton"

export function TeamSwitcher() {
  const { isMobile } = useSidebar()

  const [selectedOrgCode, setSelectedOrgCode] = React.useState<string | null>(
    null
  )

  const {
    data = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["organizations"],
    queryFn: fetchAllOrganizations,
  })

  const activeOrg =
    data.find((org) => org.organization_code === selectedOrgCode) ?? data[0]

  if (isLoading) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-[250px]" />
          <Skeleton className="h-4 w-[200px]" />
        </div>
      </div>
    )
  }

  if (isError) {
    // redirect to login
  }

  if (data.length === 0) {
    return null
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                A
              </div>

              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeOrg.organization_name}
                </span>
                <span className="truncate text-xs">
                  {activeOrg.organization_code}
                </span>
              </div>

              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel>Organizations</DropdownMenuLabel>

            {data.map((org) => (
              <DropdownMenuItem
                key={org.organization_code}
                onClick={() => setSelectedOrgCode(org.organization_code)}
              >
                {org.organization_name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
