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
      <Card>
        <CardHeader>
          <CardTitle>Edit Outlet</CardTitle>
          <CardDescription>Update an existing outlet</CardDescription>

          <CardAction>
            <Button>Save</Button>
          </CardAction>
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
