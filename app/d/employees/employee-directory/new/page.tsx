"use client"

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { AllInOneEmployeeForm } from "@/forms/employee.form"

export default function Page() {
  return (
    <>
      <Card className="border-t-4 border-t-primary">
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
