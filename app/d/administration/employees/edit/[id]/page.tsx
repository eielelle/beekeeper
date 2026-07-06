import { EmployeeForm } from "@/forms/employee.form"

export default function NewEmployeePage() {
  return (
    <section className="space-y-4">
      <header className="">
        <h1 className="text-sm font-semibold">Update Employee</h1>
        <p className="text-sm">Update employee details here</p>
      </header>

      <br />

      <EmployeeForm />
    </section>
  )
}
