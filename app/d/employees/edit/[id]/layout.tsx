"use client"

import { ReactNode } from "react"
import { usePathname, useParams, useRouter } from "next/navigation"
import { Briefcase, User } from "lucide-react"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function EditEmployeeLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()

  const id = params?.id as string

  // Define absolute URLs (make sure to include the leading "/")
  const baseUrl = `/d/employees/edit/${id}`
  const basicUrl = `${baseUrl}/basic-information`
  const workUrl = `${baseUrl}/work-information`

  // Determine active tab based on the current URL
  const activeTab = pathname.includes("work-information") ? "work" : "basic"

  // Handle tab clicks by changing the route
  const onTabChange = (value: string) => {
    if (value === "basic") router.push(basicUrl)
    if (value === "work") router.push(workUrl)
  }

  return (
    <div className="space-y-4">
      {/* Shadcn Tabs Navigation */}
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 sm:w-[400px]">
          <TabsTrigger value="basic" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Basic Information
          </TabsTrigger>
          <TabsTrigger value="work" className="flex items-center gap-2">
            <Briefcase className="h-4 w-4" />
            Work Information
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Dynamic Content (The Forms) */}
      <div>{children}</div>
    </div>
  )
}
