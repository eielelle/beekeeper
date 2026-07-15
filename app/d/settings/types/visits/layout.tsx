import ReusableTabsLayout from "@/components/custom/tabs/navigation-tab"
import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  const tabs = [
    {
      value: "types",
      label: "Types",
      href: "/d/settings/types/visits/types",
    },
  ]

  return <ReusableTabsLayout tabs={tabs}>{children}</ReusableTabsLayout>
}
