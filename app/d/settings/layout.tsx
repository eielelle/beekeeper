import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import Link from "next/link"
import { ReactNode } from "react"

// 1. Data Interfaces
export interface SettingLink {
  label: string
  href: string
}

export interface SettingSection {
  id: string
  title: string
  links: SettingLink[]
}

// 2. Navigation Data Array
export const settingsNavigation: SettingSection[] = [
  {
    id: "general",
    title: "General",
    links: [
      { label: "Profile", href: "/settings/profile" },
      { label: "Account", href: "/settings/account" },
      { label: "Appearance", href: "/settings/appearance" },
    ],
  },
  {
    id: "types",
    title: "Types & Classifications",
    links: [
      { label: "SKUs", href: "/d/settings/types/skus/categories" },
      { label: "Outlets", href: "/settings/account" },
      { label: "Expenses", href: "/d/settings/types/expenses/types" },
      { label: "Production", href: "/d/settings/types/production/areas" },
      { label: "Employees", href: "/d/settings/types/employees/types" },
    ],
  },
  {
    id: "sales-groups",
    title: "Sales Groups",
    links: [
      {
        label: "Manage Sales Groups",
        href: "/d/settings/types/skus/categories",
      },
    ],
  },
  {
    id: "master-data",
    title: "Master Data",
    links: [
      {
        label: "Manage SKUs",
        href: "/d/settings/master-data/manage-skus",
      },
      {
        label: "Manage Departments",
        href: "/d/settings/master-data/manage-departments",
      },
      {
        label: "Manage Job Positions",
        href: "/d/settings/master-data/manage-job-positions",
      },
    ],
  },
  {
    id: "access-management",
    title: "Access Management",
    links: [
      { label: "Approval Workflows", href: "/settings/acddaount" },
      {
        label: "Roles",
        href: "/d/settings/organizations/manage",
      },
      { label: "Permissions", href: "/settings/account" },
    ],
  },
  {
    id: "organizations",
    title: "Company",
    links: [
      {
        label: "Manage Organizations",
        href: "/d/settings/organizations/manage",
      },
      { label: "About Company", href: "/settings/account" },
    ],
  },
]

// 3. Component Definition
export default function Layout({ children }: { children: ReactNode }) {
  const defaultOpenSections = ["general"]

  return (
    <section>
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your account settings and preferences.
        </p>
      </header>

      <div className="flex gap-2">
        <aside className="w-full max-w-xs space-y-4 p-4">
          <Accordion
            type="multiple"
            defaultValue={defaultOpenSections}
            className="w-full rounded-lg border p-2 shadow-sm"
          >
            {settingsNavigation.map((section) => (
              <AccordionItem
                key={section.id}
                value={section.id}
                className="border-b-0"
              >
                <AccordionTrigger className="rounded-md px-2 py-2 text-sm font-medium hover:bg-muted/50 hover:no-underline">
                  {section.title}
                </AccordionTrigger>
                <AccordionContent className="flex flex-col space-y-1 px-2 pt-1 pb-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </aside>

        <section className="flex-1">{children}</section>
      </div>
    </section>
  )
}
