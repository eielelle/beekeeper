import ActiveUsersMap, {
  ActiveUser,
} from "@/components/custom/maps/active-users-map"

export default function Page() {
  const SAMPLE_ACTIVE_USERS: ActiveUser[] = [
    {
      id: "usr_01",
      name: "Miguel Santos",
      lat: 14.7616, // Marilao
      long: 120.9472,
      status: "online",
      avatarUrl: "https://i.pravatar.cc/150?u=usr_01",
    },
    {
      id: "usr_02",
      name: "Anna Reyes",
      lat: 14.676, // Quezon City
      long: 121.0437,
      status: "idle",
      avatarUrl: "https://i.pravatar.cc/150?u=usr_02",
    },
    {
      id: "usr_03",
      name: "Carlos Mendoza",
      lat: 14.5547, // Makati CBD
      long: 121.0244,
      status: "online",
      // Intentionally leaving avatarUrl undefined to test the fallback icon
    },
    {
      id: "usr_04",
      name: "Elena Cruz",
      lat: 14.5995, // Manila / Ermita
      long: 120.9842,
      status: "online",
      avatarUrl: "https://i.pravatar.cc/150?u=usr_04",
    },
    {
      id: "usr_05",
      name: "James Villanueva",
      lat: 14.5409, // BGC, Taguig
      long: 121.0503,
      status: "idle",
      avatarUrl: "https://i.pravatar.cc/150?u=usr_05",
    },
  ]

  return (
    <section>
      <header className="flex items-center justify-between">
        <h1>JUL 12, 2026, WEDNESDAY</h1>

        <div className="flex items-center gap-2">
          <div>
            <span>30 EMPLOYEES</span>
          </div>

          <div>
            <span>5 TIME IN</span>
          </div>

          <div>
            <span>7 TIME OUT</span>
          </div>

          <div>
            <span>2 REST DAY</span>
          </div>

          <div>
            <span>9 LEAVES</span>
          </div>
        </div>
      </header>

      <div>
        <div>
          <ActiveUsersMap users={SAMPLE_ACTIVE_USERS} />
        </div>

        <div>
          <p>Attendance</p>
          <p>Booking</p>
          <p>Bad Orders</p>
          <p>Sales-to-Trade</p>
          <p>Maps</p>
          <p>Expense</p>
          <p>Inventory</p>
          <p>Online Activity</p>
        </div>
      </div>
    </section>
  )
}
