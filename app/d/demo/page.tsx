"use client"

import * as React from "react"
import { useQuery } from "@tanstack/react-query"
import { CalendarDays, Clock, Loader2, MapPin } from "lucide-react"
import { EventInput } from "@fullcalendar/react"

import { EventCalendar } from "@/components/event-calendar"
import { fetchVisitPlans, getVisitPlan } from "@/forms/queries/visit_plan.query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

const getFirstItem = (data: any) => (Array.isArray(data) ? data[0] : data)

export default function VisitPlanCalendarView() {
  // 1. State to control the popup dialog
  const [selectedPlanId, setSelectedPlanId] = React.useState<string | null>(
    null
  )

  // 2. Fetch the Visit Plans for the Calendar
  const { data: plansData, isLoading: isLoadingPlans } = useQuery({
    queryKey: ["visit-plans-calendar"],
    queryFn: () =>
      fetchVisitPlans({
        pageIndex: 0,
        pageSize: 1000, // Fetch a large chunk to populate the month/year
      }),
  })

  // 3. Map Visit Plans to FullCalendar Event objects
  const events = React.useMemo<EventInput[]>(() => {
    if (!plansData?.data) return []

    return plansData.data.map((plan) => {
      const isAllDay = !plan.start_time && !plan.end_time

      // Format exact ISO strings if times exist
      const startStr = plan.start_time
        ? `${plan.start_date}T${plan.start_time}`
        : plan.start_date

      const endStr = plan.end_time
        ? `${plan.end_date}T${plan.end_time}`
        : plan.end_date

      return {
        id: plan.id,
        title: plan.title,
        start: startStr,
        end: endStr,
        allDay: isAllDay,
        extendedProps: {
          remarks: plan.remarks,
        },
      }
    })
  }, [plansData])

  // 4. Fetch specific details when a plan is clicked
  const { data: planDetails, isFetching: isFetchingDetails } = useQuery({
    queryKey: ["visit_plans", selectedPlanId],
    queryFn: () => getVisitPlan(selectedPlanId!),
    enabled: !!selectedPlanId, // Only run this query when an ID is selected
  })

  if (isLoadingPlans) {
    return (
      <div className="flex h-[600px] w-full items-center justify-center rounded-md border bg-muted/10">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <>
      {/* THE CALENDAR */}
      <div className="rounded-md border bg-background shadow-sm">
        <EventCalendar
          height={800}
          events={events}
          eventClick={(info) => {
            // Trigger the dialog by setting the selected ID
            setSelectedPlanId(info.event.id)
          }}
          addButton={{
            text: "Create Plan",
            isPrimary: true,
            click: () => {
              // Add your routing logic to open the create plan form
              console.log("Open Create Plan Form")
            },
          }}
          eventContent={(arg) => (
            <div className="flex flex-col overflow-hidden px-1 text-xs">
              <span className="truncate font-semibold">{arg.event.title}</span>
            </div>
          )}
        />
      </div>

      {/* THE DETAILS DIALOG */}
      <Dialog
        open={!!selectedPlanId}
        onOpenChange={(isOpen) => {
          if (!isOpen) setSelectedPlanId(null)
        }}
      >
        <DialogContent className="max-w-2xl">
          {isFetchingDetails || !planDetails ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {planDetails.title}
                </DialogTitle>
                <DialogDescription>
                  {planDetails.remarks || "No remarks provided for this plan."}
                </DialogDescription>
              </DialogHeader>

              <div className="mt-2 grid grid-cols-2 gap-4 rounded-md border bg-muted/20 p-4">
                <div className="flex items-center text-sm font-medium">
                  <CalendarDays className="mr-2 h-4 w-4 text-muted-foreground" />
                  {new Date(planDetails.start_date).toLocaleDateString()}
                  {planDetails.start_date !== planDetails.end_date &&
                    ` - ${new Date(planDetails.end_date).toLocaleDateString()}`}
                </div>
                <div className="flex items-center text-sm font-medium">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  {planDetails.start_time
                    ? `${planDetails.start_time} - ${planDetails.end_time || "?"}`
                    : "Anytime"}
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <h4 className="flex items-center text-sm font-semibold">
                  <MapPin className="mr-2 h-4 w-4 text-emerald-500" />
                  Route Itinerary ({planDetails.visit_plan_items?.length ||
                    0}{" "}
                  Visits)
                </h4>

                <div className="max-h-[300px] overflow-y-auto rounded-md border">
                  {planDetails.visit_plan_items?.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      No visits are attached to this plan.
                    </div>
                  ) : (
                    <div className="divide-y">
                      {planDetails.visit_plan_items?.map((item: any) => {
                        const outlet = getFirstItem(item.visits?.outlets)
                        const sDate = item.visits?.start_date
                          ? new Date(
                              item.visits.start_date
                            ).toLocaleDateString()
                          : ""

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 hover:bg-muted/10"
                          >
                            <div>
                              <p className="font-semibold text-primary">
                                {outlet?.outlet_name || "Unknown Outlet"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Scheduled: {sDate}
                              </p>
                            </div>
                            <Badge variant="outline">View details</Badge>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
