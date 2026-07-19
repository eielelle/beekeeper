"use client"

import * as React from "react"
import {
  AudioWaveform,
  BarChart,
  BookOpen,
  Bot,
  Calendar,
  Calendar1,
  CalendarCheck,
  CalendarMinus,
  Clock1,
  Coins,
  Command,
  Database,
  Factory,
  Files,
  Frame,
  GalleryVerticalEnd,
  Headset,
  Home,
  LineChart,
  Map,
  MapPin,
  Megaphone,
  Package,
  Package2,
  PieChart,
  Settings,
  Settings2,
  ShoppingBag,
  Sparkles,
  SquareTerminal,
  Store,
  Users,
  Users2,
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
import { NavSales } from "./nav.sales"
import { NavInternal } from "./nav-internal"
import { Badge } from "@/components/ui/badge"

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
      title: "Employees",
      url: "#",
      icon: Users2,
      isActive: false,
      items: [
        {
          title: "Employee Directory",
          url: "#",
        },
        {
          title: "Onboarding",
          url: "/d/production/new",
        },
        {
          title: "Offboarding",
          url: "/d/production/new",
        },
      ],
    },
    {
      title: "Attendances",
      url: "#",
      icon: Clock1,
      isActive: false,
      items: [
        {
          title: "My Attendance",
          url: "#",
        },
        {
          title: "Attendance Logs",
          url: "#",
        },
        {
          title: "Attendance Adjustments",
          url: "/d/production/new",
        },
      ],
    },
    {
      title: "Leaves",
      url: "#",
      icon: Calendar1,
      isActive: false,
      items: [
        {
          title: "My Leaves",
          url: "#",
        },
        {
          title: "Leaves",
          url: "#",
        },
      ],
    },
    {
      title: "Performance",
      url: "#",
      icon: LineChart,
      isActive: false,
      items: [
        {
          title: "KPI Tracking",
          url: "#",
        },
      ],
    },
  ],
  navSales: [
    {
      title: "Inventory",
      url: "#",
      icon: Package2,
      isActive: false,
      items: [
        {
          title: "My Inventory",
          url: "#",
        },
        {
          title: "My Bad Orders",
          url: "#",
        },
        {
          title: "My Sales-to-Trade",
          url: "#",
        },
        {
          title: "Inventory",
          url: "#",
        },
        {
          title: "Bad Orders",
          url: "#",
        },
        {
          title: "Sales-to-Trade",
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
          title: "My Visits",
          url: "#",
        },
        {
          title: "MCP",
          url: "#",
        },
        {
          title: "Visits",
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
          title: "Expenses",
          url: "#",
        },
        {
          title: "Reports",
          url: "#",
        },
      ],
    },
    {
      title: "Outlets",
      url: "#",
      icon: Store,
      isActive: false,
      items: [
        {
          title: "My Outlets",
          url: "#",
        },
        {
          title: "Outlets",
          url: "/d/outlets",
        },
        {
          title: "Outlet Assignment",
          url: "#",
        },
      ],
    },
    {
      title: "Reports",
      url: "#",
      icon: Files,
      isActive: false,
      items: [
        {
          title: "My Outlets",
          url: "#",
        },
        {
          title: "Outlets",
          url: "#",
        },
      ],
    },
  ],
  navInternal: [
    {
      title: "Production",
      url: "#",
      icon: Factory,
      isActive: false,
      items: [
        {
          title: "Overview",
          url: "#",
        },

        {
          title: "Reports",
          url: "#",
        },
        {
          title: "Production Summary",
          url: "#",
        },
        {
          title: "New Production Entry",
          url: "#",
        },
      ],
    },
    {
      title: "Help Desk",
      url: "#",
      icon: Headset,
      isActive: false,
      items: [
        {
          title: "My Tickets",
          url: "#",
        },
        {
          title: "Tickets",
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
      component: null,
    },
    {
      name: "AI",
      url: "#",
      icon: Sparkles,
      component: <Badge>Beta</Badge>,
    },
    {
      name: "Announcements",
      url: "/d/announcements",
      icon: Megaphone,
      component: null,
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavSecondary projects={data.projects} />
        <NavMain items={data.navMain} />
        <NavSales items={data.navSales} />
        <NavInternal items={data.navInternal} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
