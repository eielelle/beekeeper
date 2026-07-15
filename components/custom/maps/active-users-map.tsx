"use client"

import * as React from "react"
import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { User, Clock } from "lucide-react"

export interface ActiveUser {
  id: string
  name: string
  lat: number
  long: number
  status: "online" | "idle"
  avatarUrl?: string
}

interface ActiveUsersMapProps {
  users: ActiveUser[]
  defaultCenter?: [number, number]
  defaultZoom?: number
}

// Generates a custom pulsing dot colored based on user status
const createUserIcon = (status: ActiveUser["status"]) => {
  const isOnline = status === "online"
  const color = isOnline ? "#10b981" : "#f59e0b" // Emerald for online, Amber for idle
  const speed = isOnline ? "1.5s" : "2.5s"

  return L.divIcon({
    className: "user-marker-icon",
    html: `
      <div style="
        position: relative;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <!-- Pulsing outer ring -->
        <div style="
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background-color: ${color};
          opacity: 0.4;
          animation: ping ${speed} cubic-bezier(0, 0, 0.2, 1) infinite;
        "></div>
        <!-- Center solid dot -->
        <div style="
          position: relative;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid white;
          box-shadow: 0 0 6px rgba(0,0,0,0.4);
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12], // Position popup nicely above the dot
  })
}

// Sub-component to automatically adjust map bounds to fit all users
function MapBoundsController({
  users,
  defaultCenter,
  defaultZoom,
}: {
  users: ActiveUser[]
  defaultCenter: [number, number]
  defaultZoom: number
}) {
  const map = useMap()

  useEffect(() => {
    if (users.length === 0) {
      // No users: fallback to default center
      map.setView(defaultCenter, defaultZoom)
      return
    }

    if (users.length === 1) {
      // One user: fly directly to them
      map.flyTo([users[0].lat, users[0].long], 15, { duration: 1 })
      return
    }

    // Multiple users: fit bounds to show everyone
    const bounds = L.latLngBounds(users.map((u) => [u.lat, u.long]))
    map.fitBounds(bounds, {
      padding: [50, 50], // Add some padding so dots aren't cut off at the edges
      maxZoom: 16, // Don't zoom in too uncomfortably close
      duration: 1,
    })
  }, [users, map, defaultCenter, defaultZoom])

  return null
}

export default function ActiveUsersMap({
  users,
  defaultCenter = [14.5995, 120.9842], // Default to Manila
  defaultZoom = 13,
}: ActiveUsersMapProps) {
  return (
    <div className="space-y-4">
      {/* Inject CSS animation keyframes for pulsing GPS dots */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        /* Make leaflet popups look a bit closer to shadcn/ui */
        .leaflet-popup-content-wrapper {
          border-radius: 0.5rem;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
        }
        .leaflet-popup-content {
          margin: 0;
          line-height: normal;
        }
      `}</style>

      {/* MAP CONTAINER */}
      <div className="h-[400px] w-full overflow-hidden rounded-md border border-input bg-muted/20">
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          className="z-0 h-full w-full"
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Controller to auto-frame users whenever the array changes */}
          <MapBoundsController
            users={users}
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
          />

          {/* Render a marker for each active user */}
          {users.map((user) => (
            <Marker
              key={user.id}
              position={[user.lat, user.long]}
              icon={createUserIcon(user.status)}
            >
              <Popup className="min-w-[150px]">
                <div className="flex flex-col gap-1 p-3">
                  <div className="flex items-center gap-2 font-medium text-foreground">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="h-6 w-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-3.5 w-3.5 text-primary" />
                      </div>
                    )}
                    <span className="text-sm">{user.name}</span>
                  </div>

                  <div className="flex items-center gap-1.5 pl-8 text-xs text-muted-foreground">
                    {user.status === "online" ? (
                      <>
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        Online Now
                      </>
                    ) : (
                      <>
                        <Clock className="h-3 w-3 text-amber-500" />
                        Idle
                      </>
                    )}
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Optional User Count Footer */}
      <div className="flex items-center justify-end text-xs text-muted-foreground">
        {users.length} active user{users.length === 1 ? "" : "s"} found
      </div>
    </div>
  )
}
