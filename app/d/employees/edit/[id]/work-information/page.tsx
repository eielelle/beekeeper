"use client"

import { EmployeeWorkInformation } from "@/forms/employe_work_info.form"
import { EmployeeFormValues } from "@/forms/schemas/employee.schema"

export default function Page() {
  return (
    <EmployeeWorkInformation
      onSubmitAction={function (data: EmployeeFormValues): Promise<void> {
        throw new Error("Function not implemented.")
      }}
    />
  )
}
