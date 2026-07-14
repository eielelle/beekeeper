import ReusableTabsLayout from "@/components/custom/tabs/navigation-tab"
import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  const tabs = [
    {
      value: "types",
      label: "Types",
      href: "/d/settings/types/employees/types",
    },
    {
      value: "status",
      label: "Status",
      href: "/d/settings/types/employees/status",
    },
    {
      value: "work-type",
      label: "Work Types",
      href: "/d/settings/types/employees/work-types",
    },
  ]

  return <ReusableTabsLayout tabs={tabs}>{children}</ReusableTabsLayout>
}
