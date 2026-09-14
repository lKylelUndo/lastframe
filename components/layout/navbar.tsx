"use client"

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Menu, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavbarProps {
  session: { userId: string } | null
}

const alwaysLinks = [{ href: "/archive", label: "Archive" }] as const

const authLinks = [{ href: "/dashboard", label: "Dashboard" }] as const

export function Navbar({ session }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  function isActive(href: string) {
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(href + "/")
  }

  async function handleSignOut() {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
    router.refresh()
  }

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Close on Escape, prevent body scroll when open
  useEffect(() => {
    if (!mobileOpen) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false)
    }

    document.addEventListener("keydown", onKeyDown)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", onKeyDown)
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  function renderLinks() {
    return (
      <>
        {alwaysLinks.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "inline-flex min-h-[44px] min-w-[44px] items-center px-3 text-sm transition-colors hover:text-foreground",
              isActive(href) ? "text-foreground" : "text-muted-foreground",
            )}
            aria-current={isActive(href) ? "page" : undefined}
          >
            {label}
          </Link>
        ))}

        {session &&
          authLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "inline-flex min-h-[44px] min-w-[44px] items-center px-3 text-sm transition-colors hover:text-foreground",
                isActive(href) ? "text-foreground" : "text-muted-foreground",
              )}
              aria-current={isActive(href) ? "page" : undefined}
            >
              {label}
            </Link>
          ))}
      </>
    )
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-12 max-w-5xl items-center justify-between px-5 sm:px-6">
        {/* Left: brand + desktop links */}
        <div className="flex items-center">
          <Link
            href="/"
            className={cn(
              "mr-6 inline-flex min-h-[44px] items-center text-sm font-semibold tracking-tight transition-colors hover:text-foreground",
              isActive("/") ? "text-foreground" : "text-muted-foreground",
            )}
            aria-current={isActive("/") ? "page" : undefined}
          >
            LASTFRAME
          </Link>

          {/* Desktop links */}
          <div className="hidden items-center md:flex">
            {renderLinks()}
          </div>
        </div>

        {/* Right: desktop auth / mobile hamburger */}
        <div className="flex items-center">
          {/* Desktop: auth action (visible md+) */}
          <div className="hidden items-center md:flex">
            {session ? (
              <button
                onClick={handleSignOut}
                className="inline-flex min-h-[44px] min-w-[44px] items-center px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "inline-flex min-h-[44px] min-w-[44px] items-center px-3 text-sm transition-colors hover:text-foreground",
                  isActive("/login")
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                aria-current={isActive("/login") ? "page" : undefined}
              >
                Sign In
              </Link>
            )}
          </div>

          {/* Mobile: hamburger toggle */}
          <button
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground md:hidden"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileOpen && (
        <div className="border-t border-border bg-background px-5 py-2 md:hidden">
          <div className="flex flex-col">
            {alwaysLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "inline-flex min-h-[44px] items-center px-3 text-sm transition-colors hover:text-foreground",
                  isActive(href) ? "text-foreground" : "text-muted-foreground",
                )}
                aria-current={isActive(href) ? "page" : undefined}
                onClick={closeMobile}
              >
                {label}
              </Link>
            ))}

            {session &&
              authLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "inline-flex min-h-[44px] items-center px-3 text-sm transition-colors hover:text-foreground",
                    isActive(href) ? "text-foreground" : "text-muted-foreground",
                  )}
                  aria-current={isActive(href) ? "page" : undefined}
                  onClick={closeMobile}
                >
                  {label}
                </Link>
              ))}

            {session ? (
              <button
                onClick={handleSignOut}
                className="inline-flex min-h-[44px] items-center px-3 text-left text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className={cn(
                  "inline-flex min-h-[44px] items-center px-3 text-sm transition-colors hover:text-foreground",
                  isActive("/login")
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
                aria-current={isActive("/login") ? "page" : undefined}
                onClick={closeMobile}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
