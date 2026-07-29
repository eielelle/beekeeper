import * as React from "react"
import { User } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { EmployeeStoreType } from "@/forms/queries/employee.query"

interface EmployeeAvatarProps {
  employee: EmployeeStoreType
  className?: string
}

export function EmployeeAvatar({
  employee,
  className = "h-10 w-10",
}: EmployeeAvatarProps) {
  // Generates initials just in case the API is blocked/down
  const getInitials = (first?: string, last?: string) => {
    if (!first && !last) return null
    return `${first?.charAt(0) || ""}${last?.charAt(0) || ""}`.toUpperCase()
  }

  // Generates the Dicebear Lorelei avatar based on name & gender
  const getAvatarUrl = (emp: EmployeeStoreType) => {
    if (emp.avatar_url) return emp.avatar_url

    const seedName = encodeURIComponent(
      `${emp.first_name} ${emp.last_name} ${emp.gender || ""}`
    )

    // Assign distinct pastel background colors based on gender
    let bgColors = "backgroundColor=b6e3f4,c0aede,d1d4f9" // Default (Neutral/Cool)

    if (emp.gender === "Female") {
      bgColors = "backgroundColor=ffdfbf,ffd5dc,f4dce8" // Warm pinks/peaches
    } else if (emp.gender === "Male") {
      bgColors = "backgroundColor=b6e3f4,c0aede,d1d4f9" // Cool blues/purples
    }

    return `https://api.dicebear.com/9.x/lorelei/svg?seed=${seedName}&${bgColors}`
  }

  return (
    <Avatar className={`border bg-muted ${className}`}>
      <AvatarImage
        src={getAvatarUrl(employee)}
        alt={employee.first_name || "Employee"}
        className="object-cover"
      />
      <AvatarFallback className="text-xs font-medium text-muted-foreground">
        {getInitials(employee.first_name, employee.last_name) || (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  )
}
