"use client"

import React, { useState, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

// 6 states precisely matching image_2ac1e3.png, now with tailored text colors
const PHASES = {
  dawn: {
    bg: "bg-indigo-300",
    textMain: "text-indigo-950",
    textSub: "text-indigo-950/80",
    orbs: (
      <div className="absolute -bottom-[80%] left-[10%] h-[150%] w-[80%] rounded-full bg-orange-400 blur-[100px] transition-colors duration-1000" />
    ),
  },
  morning: {
    bg: "bg-sky-400",
    textMain: "text-sky-950",
    textSub: "text-sky-950/80",
    orbs: (
      <>
        <div className="absolute top-[-25%] left-[20%] h-[150%] w-[60%] rounded-full bg-amber-400 blur-[100px] transition-colors duration-1000" />
        <div className="absolute top-[20%] left-[40%] h-[60%] w-[20%] rounded-full bg-rose-300 blur-[60px] transition-colors duration-1000" />
      </>
    ),
  },
  afternoon: {
    bg: "bg-blue-500",
    textMain: "text-white",
    textSub: "text-white/90",
    orbs: (
      <div className="absolute -top-[75%] left-[20%] h-[150%] w-[60%] rounded-full bg-yellow-300 blur-[100px] transition-colors duration-1000" />
    ),
  },
  sunset: {
    bg: "bg-fuchsia-400/80",
    textMain: "text-white",
    textSub: "text-white/90",
    orbs: (
      <>
        <div className="absolute -bottom-[80%] left-[10%] h-[150%] w-[80%] rounded-full bg-pink-500 blur-[100px] transition-colors duration-1000" />
        <div className="absolute -bottom-[50%] left-[25%] h-[100%] w-[50%] rounded-full bg-orange-400 blur-[80px] transition-colors duration-1000" />
      </>
    ),
  },
  night: {
    bg: "bg-slate-900",
    textMain: "text-white",
    textSub: "text-white/70",
    orbs: (
      <div className="absolute top-[0%] left-[30%] h-[100%] w-[40%] rounded-full bg-blue-100 blur-[100px] transition-colors duration-1000" />
    ),
  },
  lateNight: {
    bg: "bg-black",
    textMain: "text-white",
    textSub: "text-white/70",
    orbs: (
      <div className="absolute -top-[20%] -right-[5%] h-[80%] w-[30%] rounded-full bg-slate-400 opacity-60 blur-[80px] transition-colors duration-1000" />
    ),
  },
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]

interface DaylistHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  userName?: string
}

export function DaylistHeader({
  className,
  userName = "User",
  ...props
}: DaylistHeaderProps) {
  const [now, setNow] = useState<Date | null>(null)

  useEffect(() => {
    setNow(new Date())
    const interval = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  if (!now) {
    return (
      <Skeleton
        className={cn("h-[100px] w-full max-w-[1500px] rounded-xl", className)}
      />
    )
  }

  const hour = now.getHours()

  // Phase logic
  let phase: keyof typeof PHASES = "dawn"
  if (hour >= 4 && hour < 8) phase = "dawn"
  else if (hour >= 8 && hour < 12) phase = "morning"
  else if (hour >= 12 && hour < 16) phase = "afternoon"
  else if (hour >= 16 && hour < 20) phase = "sunset"
  else if (hour >= 20 && hour < 24) phase = "night"
  else phase = "lateNight"

  // Greeting logic
  let greeting = "Good Evening"
  if (hour >= 0 && hour < 12) greeting = "Good Morning"
  else if (hour >= 12 && hour < 17) greeting = "Good Afternoon"

  // Date formatting
  const dayName = DAYS[now.getDay()]
  const date = now.getDate()
  const monthName = MONTHS[now.getMonth()]
  const year = now.getFullYear()
  const hh = hour.toString().padStart(2, "0")
  const mm = now.getMinutes().toString().padStart(2, "0")
  const dateString = `${dayName}, ${date} ${monthName} ${year} - ${hh}:${mm}`

  const activeVibe = PHASES[phase]

  return (
    <div
      className={cn(
        "relative flex h-[100px] w-full max-w-[1500px] flex-col justify-center overflow-hidden rounded-xl px-6 transition-colors duration-1000",
        activeVibe.bg,
        className
      )}
      {...props}
    >
      {/* Blurred overlay elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {activeVibe.orbs}
      </div>

      {/* Grainy Noise Overlay */}
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-[0.15] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Text Content adapting purely on color logic, no shadows */}
      <div className="relative z-20 font-sans transition-colors duration-1000">
        <h2
          className={cn(
            "text-xl font-bold tracking-tight md:text-2xl",
            activeVibe.textMain
          )}
        >
          {greeting}, {userName}
        </h2>
        <p
          className={cn(
            "mt-0.5 text-sm font-medium tracking-wide md:text-base",
            activeVibe.textSub
          )}
        >
          {dateString}
        </p>
      </div>
    </div>
  )
}
