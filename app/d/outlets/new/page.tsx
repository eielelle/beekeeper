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

import { Link } from "lucide-react"

export default function Page() {
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>New Outlet</CardTitle>
          <CardDescription>Add a new outlet</CardDescription>

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
