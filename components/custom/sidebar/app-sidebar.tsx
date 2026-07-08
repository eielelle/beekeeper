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
