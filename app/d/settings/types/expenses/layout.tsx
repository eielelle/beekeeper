import ReusableTabsLayout from "@/components/custom/tabs/navigation-tab"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  const tabs = [
    {
      value: "types",
      label: "Types",
      href: "#",
    },
  ]

  return <ReusableTabsLayout tabs={tabs}>{children}</ReusableTabsLayout>
}
