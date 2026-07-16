"use client"

import * as React from "react"

// 1. Define your available themes here.
// These must match the data-theme="..." names in your globals.css
// Change this line at the top of the file
export type ThemeColors = string

interface ColorThemeContextType {
  color: ThemeColors
  setColor: (color: ThemeColors) => void
}

const ColorThemeContext = React.createContext<
  ColorThemeContextType | undefined
>(undefined)

export function ColorProvider({ children }: { children: React.ReactNode }) {
  const [color, setColor] = React.useState<ThemeColors>("default")

  // Load the saved color from localStorage when the app loads
  React.useEffect(() => {
    const saved = localStorage.getItem("color-theme") as ThemeColors
    if (saved) {
      setColor(saved)
    }
  }, [])

  // Apply the theme to the <html> tag and save it to localStorage whenever it changes
  React.useEffect(() => {
    if (color === "default") {
      document.documentElement.removeAttribute("data-theme")
    } else {
      document.documentElement.setAttribute("data-theme", color)
    }
    localStorage.setItem("color-theme", color)
  }, [color])

  return (
    <ColorThemeContext.Provider value={{ color, setColor }}>
      {children}
    </ColorThemeContext.Provider>
  )
}

// Custom hook to use the color state in your components
export function useColor() {
  const context = React.useContext(ColorThemeContext)
  if (!context) {
    throw new Error("useColor must be used within a ColorProvider")
  }
  return context
}
