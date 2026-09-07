import { getOutletAction } from "@/actions/outlet.action"
import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { OutletStoreType } from "@/forms/queries/outlet.query"
import { Edit, Trash } from "lucide-react"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params

  let outlet: OutletStoreType
  try {
    outlet = await getOutletAction(id)
  } catch (error) {
    notFound()
  }

  return (
    <section className="space-y-4">
      <Card className="border-t-2 border-t-primary">
        <CardHeader>
          <CardTitle>{outlet.outlet_name}</CardTitle>
          <CardDescription>Database Record Details</CardDescription>

          <CardAction>
            <ButtonGroup>
              <Button size={"icon-sm"} variant={"outline"}>
                <Edit />
              </Button>
              <Button size={"icon-sm"} variant={"outline"}>
                <Trash />
              </Button>
            </ButtonGroup>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Outlet Name</p>
              <p className="text-xs">{outlet.outlet_name || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Outlet Code</p>
              <p className="text-xs">{outlet.outlet_code || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Address</p>
              <p className="text-xs">{outlet.address || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Barangay</p>
              <p className="text-xs">{outlet.barangay || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">City</p>
              <p className="text-xs">{outlet.city || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Province</p>
              <p className="text-xs">{outlet.province || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Region</p>
              <p className="text-xs">{outlet.region || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Latitude</p>
              <p className="text-xs">{outlet.lat}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Longitude</p>
              <p className="text-xs">{outlet.long}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">
                Geofence Radius (m)
              </p>
              <p className="text-xs">{outlet.geofence_radius}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Is Active</p>
              <p className="text-xs">{outlet.is_active ? "Yes" : "No"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Is Distributor</p>
              <p className="text-xs">{outlet.is_distributor ? "Yes" : "No"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Distributor ID</p>
              <p className="text-xs">{outlet.distributor_id || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Distributor Name</p>
              <p className="text-xs">
                {outlet.distributor?.outlet_name || "-"}
              </p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Sales Group ID</p>
              <p className="text-xs">{outlet.sales_group_id || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Org ID</p>
              <p className="text-xs">{outlet.org_id || "-"}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Created At</p>
              <p className="text-xs">
                {outlet.created_at
                  ? new Date(outlet.created_at).toLocaleString()
                  : "-"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
