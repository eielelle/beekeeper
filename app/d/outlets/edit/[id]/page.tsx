import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OutletForm } from "@/forms/outlet.form"

export default function Page() {
  return (
    <>
      <Card className="border-t-4 border-t-primary">
        <CardHeader>
          <CardTitle>Edit Outlet</CardTitle>
          <CardDescription>Update an existing outlet</CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <OutletForm />
        </CardContent>
      </Card>
    </>
  )
}
