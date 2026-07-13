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
import { NavSales } from "./nav.sales"
import { NavInternal } from "./nav-internal"

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
      title: "Recruitment",
      url: "#",
      icon: Factory,
      isActive: false,
      items: [
        {
          title: "WIP",
          url: "#",
        },
      ],
    },
    {
      title: "Employees",
      url: "#",
      icon: Factory,
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
      icon: Factory,
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
      icon: Factory,
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
      title: "Payroll",
      url: "#",
      icon: Factory,
      isActive: false,
      items: [
        {
          title: "Dashboard",
          url: "#",
        },
        {
          title: "Allowances",
          url: "#",
        },
        {
          title: "Deductions",
          url: "#",
        },
        {
          title: "Payslips",
          url: "#",
        },
        {
          title: "Loans / Advance Salary",
          url: "#",
        },
        {
          title: "Deductions",
          url: "#",
        },
      ],
    },
    {
      title: "Performance",
      url: "#",
      icon: Factory,
      isActive: false,
      items: [
        {
          title: "KPI Tracking",
          url: "#",
        },
      ],
    },
    {
      title: "Help Desk",
      url: "#",
      icon: Factory,
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
    {
      title: "Administration",
      url: "#",
      icon: Factory,
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
  navSales: [
    {
      title: "Inventory",
      url: "#",
      icon: Factory,
      isActive: false,
      items: [
        {
          title: "My Inventory",
          url: "#",
        },
        {
          title: "Inventory",
          url: "#",
        },
        {
          title: "Returns",
          url: "#",
        },
      ],
    },
    {
      title: "Visits",
      url: "#",
      icon: Factory,
      isActive: false,
      items: [
        {
          title: "My Visits",
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
      icon: Factory,
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
      icon: Factory,
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
    {
      title: "Reports",
      url: "#",
      icon: Factory,
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
    {
      name: "Settings",
      url: "/d/settings",
      icon: Settings,
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
