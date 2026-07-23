"use client"

import * as React from "react"
import { useEffect, useRef } from "react"
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"

// Custom CSS-based GPS Joyride Dot Icon
const gpsDotIcon = L.divIcon({
  className: "gps-marker-icon",
  html: `
    <div style="
      position: relative;
      width: 20px;
      height: 20px;
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
        background-color: #2563eb;
        opacity: 0.4;
        animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      "></div>
      <!-- Center solid dot -->
      <div style="
        position: relative;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background-color: #2563eb;
        border: 2px solid white;
        box-shadow: 0 0 6px rgba(0,0,0,0.4);
      "></div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
})

// Sub-component to re-center map ONLY when coordinates actually change
function MapViewController({ center }: { center: [number, number] }) {
  const map = useMap()
  const prevCenterRef = useRef<string>("")

  useEffect(() => {
    const currentCenterStr = center.join(",")
    if (prevCenterRef.current !== currentCenterStr) {
      prevCenterRef.current = currentCenterStr
      map.flyTo(center, map.getZoom(), { duration: 0.5 })
    }
  }, [center, map])

  return null
}

export default function MapViewer({
  lat,
  long,
}: {
  lat: number | string
  long: number | string
}) {
  // Safety check: parse to float to avoid Leaflet throwing silent string errors
  const safeLat = typeof lat === "string" ? parseFloat(lat) : lat
  const safeLng = typeof long === "string" ? parseFloat(long) : long
  const position: [number, number] = [safeLat || 14.5995, safeLng || 120.9842]

  return (
    <div className="space-y-4">
      {/* Inject CSS animation keyframes for pulsing GPS dot */}
      <style>{`
        @keyframes ping {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
      `}</style>

      {/* MAP CONTAINER - Using the exact same wrapper as LocationPicker */}
      <div className="h-64 w-full overflow-hidden rounded-md border border-input">
        <MapContainer
          center={position}
          zoom={15}
          className="z-0 h-full w-full"
          // Disable interaction for a clean, read-only preview
          dragging={false}
          scrollWheelZoom={false}
          zoomControl={false}
          doubleClickZoom={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapViewController center={position} />

          <Marker draggable={false} icon={gpsDotIcon} position={position} />
        </MapContainer>
      </div>
    </div>
  )
}
