import ReusableTabsLayout from "@/components/custom/tabs/navigation-tab"
import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  const tabs = [
    {
      value: "areas",
      label: "Areas",
      href: "/d/settings/types/production/areas",
    },
    {
      value: "lines",
      label: "Lines",
      href: "/d/settings/types/production/lines",
    },
  ]

  return <ReusableTabsLayout tabs={tabs}>{children}</ReusableTabsLayout>
}
