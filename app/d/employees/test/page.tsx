"use client"

import { EmployeeBankInformation } from "@/forms/employee_bank_info.form"
import { EmployeeFormValues } from "@/forms/schemas/employee.schema"

export default function Page() {
  return (
    // <AllInOneEmployeeForm
    //   onSubmitAction={function (data: EmployeeFormValues): Promise<void> {
    //     throw new Error("Function not implemented.")
    //   }}
    // />
    // <EmployeeWorkInformation
    //   onSubmitAction={function (data: EmployeeFormValues): Promise<void> {
    //     throw new Error("Function not implemented.")
    //   }}
    // />
    <EmployeeBankInformation
      onSubmitAction={function (
        data: Partial<EmployeeFormValues>
      ): Promise<void> {
        throw new Error("Function not implemented.")
      }}
    />
  )
}
