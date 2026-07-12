import ReusableTabsLayout from "@/components/custom/tabs/navigation-tab"
import { ReactNode } from "react"

export default function Layout({ children }: { children: ReactNode }) {
  const tabs = [
    {
      value: "categories",
      label: "Categories",
      href: "/d/settings/types/skus/categories",
    },
    {
      value: "brands",
      label: "Brands",
      href: "/d/settings/types/skus/brands",
    },
    {
      value: "uoms",
      label: "UOMs",
      href: "/d/settings/types/skus/uoms",
    },
  ]

  return <ReusableTabsLayout tabs={tabs}>{children}</ReusableTabsLayout>
}
