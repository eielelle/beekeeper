"use client"

import * as React from "react"
import { useEffect, useRef, useState } from "react"
import {
  MapContainer,
  TileLayer,
  Marker,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { Search, Loader2, MapPin } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

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

interface LocationPickerProps {
  lat: number
  long: number
  radius?: number
  onChange: (coords: { lat: number; long: number }) => void
  onRadiusChange?: (radius: number) => void
}

interface SearchResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
}

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

function MapEventsHandler({
  onChange,
}: {
  onChange: (coords: { lat: number; long: number }) => void
}) {
  useMapEvents({
    click(e) {
      onChange({ lat: e.latlng.lat, long: e.latlng.lng })
    },
  })
  return null
}

export default function LocationPicker({
  lat,
  long,
  radius = 100,
  onChange,
  onRadiusChange,
}: LocationPickerProps) {
  const defaultLat = lat || 14.5995
  const defaultLng = long || 120.9842
  const position: [number, number] = [defaultLat, defaultLng]

  // Location Search States
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)

  // Debounced search effect targeting Nominatim API
  useEffect(() => {
    ;(async () => {
      if (!searchQuery.trim() || searchQuery.length < 3) {
        setSearchResults([])
        setIsSearching(false)
        return
      }

      // AbortController cancels pending requests when user keeps typing or deleting
      const controller = new AbortController()
      const { signal } = controller

      setIsSearching(true)
      const timer = setTimeout(async () => {
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
              searchQuery
            )}&limit=5`,
            {
              signal,
              headers: {
                "User-Agent": "LocationPickerApp/1.0",
              },
            }
          )

          if (!response.ok) throw new Error("Search network error")

          const data = await response.json()
          setSearchResults(data)
          setShowDropdown(true)
        } catch (error) {
          // Type guard to safely check error properties without using 'any'
          if (error instanceof Error && error.name !== "AbortError") {
            console.error("Geocoding failed:", error.message)
            setSearchResults([])
          }
        } finally {
          if (!signal.aborted) {
            setIsSearching(false)
          }
        }
      }, 2000)

      return () => {
        clearTimeout(timer)
        controller.abort() // Cancel any in-flight request on cleanup
      }
    })()
  }, [searchQuery])

  const handleSelectLocation = (result: SearchResult) => {
    const newLat = parseFloat(result.lat)
    const newLng = parseFloat(result.lon)

    onChange({ lat: newLat, long: newLng })
    setSearchQuery(result.display_name)
    setShowDropdown(false)
  }

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

      {/* LOCATION SEARCH INPUT */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search address or location..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setShowDropdown(true)
            }}
            className="pr-8 pl-9 text-xs"
          />
          {isSearching && (
            <Loader2 className="absolute right-2.5 h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>

        {/* SEARCH RESULTS DROPDOWN */}
        {showDropdown && searchResults.length > 0 && (
          <div className="absolute z-[1000] mt-1 max-h-56 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md">
            <ul className="py-1">
              {searchResults.map((result) => (
                <li
                  key={result.place_id}
                  onClick={() => handleSelectLocation(result)}
                  className="flex cursor-pointer items-start gap-2 px-3 py-2 text-xs hover:bg-accent hover:text-accent-foreground"
                >
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{result.display_name}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* MAP CONTAINER */}
      <div className="h-64 w-full overflow-hidden rounded-md border border-input">
        <MapContainer center={position} zoom={15} className="z-0 h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* Smoothly recenters map on coordinate changes */}
          <MapViewController center={position} />

          {/* Click event handler */}
          <MapEventsHandler onChange={onChange} />

          {/* GPS Dot Marker */}
          <Marker
            draggable={true}
            icon={gpsDotIcon}
            position={position}
            eventHandlers={{
              dragend: (e) => {
                const marker = e.target
                const newPos = marker.getLatLng()
                onChange({ lat: newPos.lat, long: newPos.lng })
              },
            }}
          />

          {/* Geofence Circle Overlay */}
          <Circle
            center={position}
            radius={radius}
            pathOptions={{
              color: "#2563eb",
              fillColor: "#3b82f6",
              fillOpacity: 0.15,
            }}
          />
        </MapContainer>
      </div>

      {/* GEOFENCE RADIUS CONTROLS */}
      {onRadiusChange && (
        <div className="space-y-2 rounded-md border bg-muted/10 p-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="geofence-radius" className="text-xs font-medium">
              Geofence Radius
            </Label>
            <div className="flex items-center gap-1">
              <Input
                id="geofence-radius"
                type="number"
                min={10}
                max={10000}
                value={radius}
                onChange={(e) => onRadiusChange(Number(e.target.value))}
                className="h-7 w-20 text-right text-xs"
              />
              <span className="text-xs text-muted-foreground">m</span>
            </div>
          </div>

          <Slider
            value={[radius]}
            min={10}
            max={5000}
            step={10}
            onValueChange={([val]) => onRadiusChange(val)}
            className="py-1"
          />
        </div>
      )}
    </div>
  )
}
