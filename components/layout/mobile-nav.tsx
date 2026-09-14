"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Camera, Upload, LayoutDashboard } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/archive", label: "Archive", icon: Camera },
  { href: "/submit", label: "Submit", icon: Upload },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
] as const

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Mobile navigation"
    >
      <ul className="flex items-stretch justify-around">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/")
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "flex min-h-[48px] min-w-[48px] flex-col items-center justify-center gap-0.5 px-4 py-2 text-xs font-medium transition-colors",
                  isActive
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
                <span>{label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
