"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AllInOneEmployeeForm } from "@/forms/employee.form"
import { EmployeeFormValues } from "@/forms/schemas/employee.schema"

export default function Page() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Add New Employee</CardTitle>
          <CardDescription>
            Enter the details to create a new employee profile.
          </CardDescription>
        </CardHeader>
      </Card>

      <AllInOneEmployeeForm />
    </>
  )
}
