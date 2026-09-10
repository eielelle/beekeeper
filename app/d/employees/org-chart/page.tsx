import OrgChartCanvas from "@/components/custom/canvas/org-chart/canvas"

// Simulate database fetch - Replace this with your actual database query
// Ensure you LEFT JOIN public.positions to get the position title
async function getEmployeesForChart() {
  return [
    {
      id: 1,
      first_name: "Jane",
      last_name: "Doe",
      employee_no: "EMP-001",
      work_email: "jane@company.com",
      reports_to_id: null,
      position_title: "CEO",
    },
    {
      id: 2,
      first_name: "John",
      last_name: "Smith",
      employee_no: "EMP-002",
      work_email: "john@company.com",
      reports_to_id: 1,
      position_title: "CTO",
    },
    {
      id: 3,
      first_name: "Alice",
      last_name: "Johnson",
      employee_no: "EMP-003",
      work_email: "alice@company.com",
      reports_to_id: 1,
      position_title: "CFO",
    },
    {
      id: 4,
      first_name: "Bob",
      last_name: "Williams",
      employee_no: "EMP-004",
      work_email: "bob@company.com",
      reports_to_id: 2,
      position_title: "Lead Developer",
    },
    {
      id: 5,
      first_name: "Charlie",
      last_name: "Brown",
      employee_no: "EMP-005",
      work_email: "charlie@company.com",
      reports_to_id: 2,
      position_title: "DevOps Engineer",
    },
  ]
}

export default async function OrgChartPage() {
  const employees = await getEmployeesForChart()

  return (
    <div className="mx-auto max-w-screen-2xl space-y-4 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Organizational Chart
        </h1>
        <p className="mt-2 text-muted-foreground">
          Interactive view of company reporting structures.
        </p>
      </div>

      {/* Mount the interactive canvas */}
      <OrgChartCanvas employees={employees} />
    </div>
  )
}
