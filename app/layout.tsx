import { Geist, Geist_Mono } from "next/font/google"
import type { Metadata, Viewport } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { MobileNav } from "@/components/layout/mobile-nav"
import { Navbar } from "@/components/layout/navbar"
import { getSession } from "@/lib/auth"
import { cn } from "@/lib/utils"

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: {
    default: "LastFrame",
    template: "%s — LastFrame",
  },
  description: "The last frame before leaving.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "LastFrame",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.svg",
  },
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1a1a" },
  ],
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await getSession()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "antialiased",
        fontMono.variable,
        "font-sans",
        geist.variable
      )}
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className="pb-[env(safe-area-inset-bottom)]">
        <ThemeProvider>
          <Navbar session={session} />
          {children}
          <MobileNav session={session} />
        </ThemeProvider>
      </body>
    </html>
  )
}
