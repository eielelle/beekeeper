"use client"

import { useTheme } from "next-themes"
import { useColor } from "./color-provider"
import { Moon, Sun } from "lucide-react"

export function ThemePicker() {
  const { setTheme, theme } = useTheme()
  const { color, setColor } = useColor()

  return (
    <div className="flex w-fit items-center gap-4 rounded-lg border bg-card p-2 text-card-foreground shadow-sm">
      {/* Light / Dark Toggle */}
      <button
        className="rounded-md p-2 transition-colors hover:bg-muted"
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        aria-label="Toggle dark mode"
      >
        <Sun className="h-5 w-5 dark:hidden" />
        <Moon className="hidden h-5 w-5 dark:block" />
      </button>

      <div className="h-6 w-px bg-border" />

      {/* Color Preset Toggles */}
      <div className="flex gap-2">
        <button
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            color === "default"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => setColor("default")}
        >
          Default
        </button>
        <button
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            color === "claude-plus"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => setColor("claude-plus")}
        >
          Claude Plus
        </button>

        <button
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            color === "whatsapp"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => setColor("whatsapp")}
        >
          whatsapp
        </button>

        <button
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            color === "sakura"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => setColor("sakura")}
        >
          sakura
        </button>

        <button
          className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
            color === "terminal"
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
          onClick={() => setColor("terminal")}
        >
          terminal
        </button>
      </div>
    </div>
  )
}
