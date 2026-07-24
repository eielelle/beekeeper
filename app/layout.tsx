import {
  Geist_Mono,
  Outfit,
  Roboto,
  Inter,
  JetBrains_Mono,
  VT323,
} from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@/lib/utils"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Toaster } from "sonner"
import { QueryProvider } from "@/components/custom/providers/query"
import { ColorProvider } from "@/components/custom/custom-themes/color-provider"

// 1. CASL Imports
import { fetchUserPermissions } from "@/lib/casl/server"
import { CaslProvider } from "@/lib/providers/casl-provider"

// 1. Default Mono
const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

// 2. Claude Plus Font
const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
})

// 3. WhatsApp Font
const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  variable: "--font-roboto",
})

// 4. Inter Font
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

// 5. JetBrains Mono Font
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
})

// 6. New: VT323 Font (Retro Terminal)
const vt323 = VT323({
  weight: "400", // VT323 only comes in 400 weight, Next.js requires it to be explicit
  subsets: ["latin"],
  variable: "--font-vt323",
})

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Fetch user permissions on the server before rendering the page
  const { permissions, isSuperuser } = await fetchUserPermissions()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        outfit.variable,
        roboto.variable,
        inter.variable,
        jetbrainsMono.variable,
        vt323.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                let theme = localStorage.getItem('color-theme');
                if (theme && theme !== 'default') {
                  document.documentElement.setAttribute('data-theme', theme);
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body>
        <TooltipProvider>
          <Toaster />
          <QueryProvider>
            <ThemeProvider>
              {/* Wrap the app in the CASL Provider */}
              <CaslProvider permissions={permissions} isSuperuser={isSuperuser}>
                <ColorProvider>{children}</ColorProvider>
              </CaslProvider>
            </ThemeProvider>
          </QueryProvider>
        </TooltipProvider>
      </body>
    </html>
  )
}
