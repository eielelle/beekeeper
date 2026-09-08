export type DateFormatPreset = "short" | "medium" | "long" | "full" | "relative"

export interface FormatSupabaseDateOptions {
  /** Formatting preset style */
  preset?: DateFormatPreset
  /** Whether to append time (e.g., 2:30 PM) */
  includeTime?: boolean
  /** BCP 47 language tag (e.g., 'en-US', 'en-GB') */
  locale?: string
  /** Fallback string returned when timestamp is null or invalid */
  fallback?: string
}

/**
 * Converts a Supabase ISO timestamp into a human-readable date string.
 *
 * @param timestamp - The ISO 8601 string from Supabase (e.g., "2026-03-15T14:30:00.000Z")
 * @param options - Customization options for locale, formatting, and fallbacks
 */
export function formatSupabaseDate(
  timestamp: string | null | undefined,
  options: FormatSupabaseDateOptions = {}
): string {
  const {
    preset = "medium",
    includeTime = false,
    locale = "en-US",
    fallback = "N/A",
  } = options

  if (!timestamp) {
    return fallback
  }

  const date = new Date(timestamp)

  // Return fallback if the timestamp string is malformed
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  // Handle relative formatting ("2 hours ago", "3 days ago")
  if (preset === "relative") {
    return getRelativeTimeString(date, locale)
  }

  const presetConfigs: Record<
    Exclude<DateFormatPreset, "relative">,
    Intl.DateTimeFormatOptions
  > = {
    short: { month: "numeric", day: "numeric", year: "2-digit" },
    medium: { month: "short", day: "numeric", year: "numeric" },
    long: { month: "long", day: "numeric", year: "numeric" },
    full: { weekday: "short", month: "long", day: "numeric", year: "numeric" },
  }

  const timeOptions: Intl.DateTimeFormatOptions = includeTime
    ? { hour: "numeric", minute: "2-digit" }
    : {}

  const formatOptions: Intl.DateTimeFormatOptions = {
    ...presetConfigs[preset],
    ...timeOptions,
  }

  return new Intl.DateTimeFormat(locale, formatOptions).format(date)
}

/**
 * Helper to calculate relative time strings using Intl.RelativeTimeFormat
 */
function getRelativeTimeString(date: Date, locale: string): string {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" })
  const elapsedMs = date.getTime() - Date.now()
  const elapsedSeconds = Math.round(elapsedMs / 1000)

  const Cutoffs = [
    { limit: 60, unit: "second", divisor: 1 },
    { limit: 3600, unit: "minute", divisor: 60 },
    { limit: 86400, unit: "hour", divisor: 3600 },
    { limit: 2592000, unit: "day", divisor: 86400 },
    { limit: 31536000, unit: "month", divisor: 2592000 },
    { limit: Infinity, unit: "year", divisor: 31536000 },
  ] as const

  const absoluteSeconds = Math.abs(elapsedSeconds)

  for (const { limit, unit, divisor } of Cutoffs) {
    if (absoluteSeconds < limit) {
      const value = Math.round(elapsedSeconds / divisor)
      return rtf.format(value, unit)
    }
  }

  return date.toLocaleDateString(locale)
}
