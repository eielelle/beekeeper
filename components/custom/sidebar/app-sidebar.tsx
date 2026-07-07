"use client"

import * as React from "react"
import {
  AudioWaveform,
  BarChart,
  BookOpen,
  Bot,
  Calendar,
  Coins,
  Command,
  Database,
  Factory,
  Frame,
  GalleryVerticalEnd,
  Home,
  LineChart,
  Map,
  MapPin,
  Package,
  PieChart,
  Settings,
  Settings2,
  ShoppingBag,
  SquareTerminal,
  Users,
} from "lucide-react"

import { NavMain } from "./nav-main"
import { NavSecondary } from "./nav-secondary"
import { NavUser } from "./nav-user"
import { TeamSwitcher } from "./team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"

// This is sample data.
const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
  navMain: [
    {
      title: "Production",
      url: "#",
      icon: Factory,
      isActive: false,
      items: [
        {
          title: "Summary",
          url: "#",
        },
        {
          title: "New Production",
          url: "/d/production/new",
        },
      ],
    },
    {
      title: "Inventory",
      url: "#",
      icon: Package,
      isActive: false,
      items: [
        {
          title: "All Inventory",
          url: "#",
        },
        {
          title: "Bad Orders",
          url: "#",
        },
        {
          title: "Sales to Trade",
          url: "#",
        },
      ],
    },
    {
      title: "Sales",
      url: "#",
      icon: ShoppingBag,
      isActive: false,
      items: [
        {
          title: "All Orders",
          url: "#",
        },
        {
          title: "Booking",
          url: "#",
        },
      ],
    },
    {
      title: "Expenses",
      url: "#",
      icon: Coins,
      isActive: false,
      items: [
        {
          title: "All Expenses",
          url: "#",
        },
        {
          title: "New Expense Request",
          url: "#",
        },
      ],
    },
    {
      title: "Visits",
      url: "#",
      icon: MapPin,
      isActive: false,
      items: [
        {
          title: "All Visits",
          url: "#",
        },
        {
          title: "Plan Visit",
          url: "#",
        },
      ],
    },
    {
      title: "Attendance",
      url: "#",
      icon: Calendar,
      isActive: false,
      items: [
        {
          title: "All Attendances",
          url: "#",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: BarChart,
      isActive: false,
      items: [],
    },
    {
      title: "Database",
      url: "#",
      icon: Database,
      isActive: false,
      items: [
        {
          title: "Item Master Data",
          url: "#",
        },
        {
          title: "Outlets",
          url: "#",
        },
      ],
    },
    {
      title: "Administration",
      url: "#",
      icon: Settings,
      isActive: false,
      items: [
        {
          title: "About Company",
          url: "/d/administration/about",
        },
        {
          title: "Production",
          url: "/d/administration/production",
        },
        {
          title: "Organizations",
          url: "#",
        },
        {
          title: "Attendance",
          url: "#",
        },
        {
          title: "Expenses",
          url: "#",
        },
        {
          title: "Inventory",
          url: "/d/administration/inventory",
        },
        {
          title: "Authorizations",
          url: "#",
        },
      ],
    },
  ],
  projects: [
    {
      name: "Feed",
      url: "#",
      icon: Home,
    },
    {
      name: "Tracking",
      url: "#",
      icon: LineChart,
    },
    {
      name: "Employees",
      url: "/d/administration/employees",
      icon: Users,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary projects={data.projects} />
        <NavMain items={data.navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
