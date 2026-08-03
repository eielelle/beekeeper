"use client"

import * as React from "react"
import { MapPin } from "lucide-react"
import dynamic from "next/dynamic"

import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Skeleton } from "@/components/ui/skeleton"

// Dynamically import MapViewer to prevent SSR issues with Leaflet
// Adjust the path to map-viewer if needed
const MapViewer = dynamic(() => import("@/components/custom/maps/map-viewer"), {
  ssr: false,
  loading: () => <Skeleton className="h-64 w-full rounded-md" />,
})

interface CoordinateHoverMapProps {
  lat?: number | string | null
  long?: number | string | null
  className?: string
}

export function CoordinateHoverMap({
  lat,
  long,
  className,
}: CoordinateHoverMapProps) {
  // Ensure we have valid numbers
  const displayLat = typeof lat === "string" ? parseFloat(lat) : lat
  const displayLong = typeof long === "string" ? parseFloat(long) : long

  // If no coordinates are provided, show a fallback
  if (!displayLat || !displayLong) {
    return (
      <span className="text-xs text-muted-foreground">No Location Data</span>
    )
  }

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <div
          className={`inline-flex cursor-help items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground ${className}`}
        >
          <MapPin className="h-3 w-3 text-emerald-500" />
          <span className="underline decoration-muted-foreground/30 underline-offset-2">
            {displayLat.toFixed(4)}, {displayLong.toFixed(4)}
          </span>
        </div>
      </HoverCardTrigger>
      {/* Set a fixed width large enough for the map */}
      <HoverCardContent
        className="w-[320px] p-3 shadow-lg sm:w-[400px]"
        align="start"
        side="top"
      >
        <div className="space-y-2">
          <div className="text-sm font-semibold tracking-tight text-foreground">
            Location Preview
          </div>
          {/* Your map viewer */}
          <MapViewer lat={displayLat} long={displayLong} />
        </div>
      </HoverCardContent>
    </HoverCard>
  )
}
