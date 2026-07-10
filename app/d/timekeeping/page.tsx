"use client"

import * as React from "react"
import { useMutation } from "@tanstack/react-query"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { clockIn, clockOut } from "@/forms/queries/timekeeper.query" // Adjust this import path as needed

export default function Page() {
  // 1. Clock In Mutation
  const clockInMutation = useMutation({
    mutationFn: clockIn,
  })

  // 2. Clock Out Mutation
  const clockOutMutation = useMutation({
    mutationFn: clockOut,
  })

  // Helper to handle capturing coordinates and triggering the correct mutation
  const handleAttendance = (type: "in" | "out") => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.")
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          long: position.coords.longitude,
        }

        if (type === "in") {
          clockInMutation.mutate(coords)
        } else {
          clockOutMutation.mutate(coords)
        }
      },
      (error) => {
        // toast.error(
        //   `Location Error: ${error.message}. Please enable location permissions.`
        // )

        // remove this after testing
        const coords = {
          lat: 1,
          long: 1,
        }

        if (type === "in") {
          clockInMutation.mutate(coords)
        } else {
          clockOutMutation.mutate(coords)
        }
      },
      { enableHighAccuracy: true }
    )
  }

  // Combine pending states to disable both buttons during an active request
  const isPending = clockInMutation.isPending || clockOutMutation.isPending

  return (
    <div className="flex min-h-screen items-center justify-center gap-4 bg-background p-4">
      <Button
        size="lg"
        variant="default"
        onClick={() => handleAttendance("in")}
        disabled={isPending}
        className="w-32"
      >
        {clockInMutation.isPending ? "Timing In..." : "TIME IN"}
      </Button>

      <Button
        size="lg"
        variant="destructive"
        onClick={() => handleAttendance("out")}
        disabled={isPending}
        className="w-32"
      >
        {clockOutMutation.isPending ? "Timing Out..." : "TIME OUT"}
      </Button>
    </div>
  )
}
