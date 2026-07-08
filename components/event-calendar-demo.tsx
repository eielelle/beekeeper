import { EventCalendar } from "@/components/event-calendar"

export function EventCalendarDemo() {
  const events = [
    {
      id: "1",
      title: "Meeting",
      start: "2026-07-08T09:00:00",
      end: "2026-07-08T10:00:00",
    },
    {
      id: "2",
      title: "Holiday",
      start: "2026-07-10",
      allDay: true,
    },
  ]

  return (
    <EventCalendar
      className="mx-auto my-10 max-w-300"
      editable
      selectable
      nowIndicator
      navLinks
      timeZone="UTC"
      events={events}
      addButton={{
        text: "Add Event",
        click() {
          alert("add event...")
        },
      }}
    />
  )
}
