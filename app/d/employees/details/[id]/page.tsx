import { getEmployeeAction } from "@/actions/employee.action"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EmployeeStoreType } from "@/forms/queries/employee.query"
import {
  Briefcase,
  Building,
  Mail,
  Phone,
  Calendar,
  User,
  Activity,
} from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

const formatDate = (dateString?: Date | string | null) => {
  if (!dateString) return "-"
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  let employee: EmployeeStoreType
  try {
    employee = await getEmployeeAction(id)
  } catch (error) {
    notFound()
  }

  return (
    <div className="">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt="Avatar"
                className="h-16 w-16 rounded-full border object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full border bg-muted">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <span>
                  {employee.first_name}{" "}
                  {employee.middle_name?.charAt(0)
                    ? `${employee.middle_name.charAt(0)}.`
                    : ""}{" "}
                  {employee.last_name} {employee.suffix}
                </span>
                <span className="text-sm font-normal text-muted-foreground">
                  ({employee.employee_no})
                </span>
              </CardTitle>
              <CardDescription className="mt-2 flex flex-col gap-4 sm:flex-row">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4" />
                  <span>Role ID: {employee.role_id || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>Org ID: {employee.org_id || "Unassigned"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>{employee.work_email || "No work email"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>{employee.work_phone || "No work phone"}</span>
                </div>
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-5 w-5 text-muted-foreground" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Nickname
            </p>
            <p className="text-sm font-semibold">{employee.nickname || "-"}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Maiden Name
            </p>
            <p className="text-sm font-semibold">
              {employee.maiden_name || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Date of Birth
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.date_of_birth)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Gender</p>
            <p className="text-sm font-semibold capitalize">
              {employee.gender || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Civil Status
            </p>
            <p className="text-sm font-semibold capitalize">
              {employee.civil_status || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Nationality
            </p>
            <p className="text-sm font-semibold">
              {employee.nationality || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Blood Type
            </p>
            <p className="text-sm font-semibold">
              {employee.blood_type || "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-5 w-5 text-muted-foreground" />
            Contact Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Personal Email
            </p>
            <p className="text-sm font-semibold">
              {employee.personal_email || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Personal Mobile
            </p>
            <p className="text-sm font-semibold">
              {employee.personal_mobile || "-"}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-muted-foreground" />
            Employment Details
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Account Status
            </p>
            <p className="text-sm font-semibold">
              {employee.account_status || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Employee Status
            </p>
            <p className="text-sm font-semibold">
              {employee.employee_status || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Work Arrangement
            </p>
            <p className="text-sm font-semibold">
              {employee.work_arrangement || "-"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Employment Start
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.employment_start)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Effective Start Date
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.effective_start_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Original Hire Date
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.original_hire_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Current Hire Date
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.current_hire_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Probation End Date
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.probation_end_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Regularization Date
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.regularization_date)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Contract Expiry
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.contract_expiry_date)}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Activity className="h-5 w-5 text-muted-foreground" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              System ID
            </p>
            <p className="text-sm font-semibold">{employee.id}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              User UUID
            </p>
            <p
              className="truncate text-sm font-semibold"
              title={employee.user_id || ""}
            >
              {employee.user_id || "Unlinked"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Reports To (ID)
            </p>
            <p className="text-sm font-semibold">
              {employee.reports_to_id || "None"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Superuser
            </p>
            <p className="text-sm font-semibold">
              {employee.is_superuser ? "Yes" : "No"}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Profile Created
            </p>
            <p className="text-sm font-semibold">
              {formatDate(employee.created_at)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
