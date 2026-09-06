"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Receipt,
  PiggyBank,
  Target,
  Repeat,
  BarChart3,
  Sparkles,
  Settings,
  Bell,
  Wallet,
  CreditCard,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Budgets", href: "/budgets", icon: PiggyBank },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Subscriptions", href: "/subscriptions", icon: CreditCard },
  { name: "Recurring", href: "/recurring", icon: Repeat },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Financial Insights", href: "/insights", icon: Sparkles },
  { name: "Notifications", href: "/notifications", icon: Bell },
  { name: "Settings", href: "/settings", icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-40 border-r border-border bg-card/60 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-6 border-b border-border">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow">
          <Wallet className="h-5 w-5" />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tracking-tight">Personal Finance</span>
          <span className="text-[11px] text-muted-foreground font-medium">Student Portfolio</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between overflow-y-auto px-4 py-4">
        <nav className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href))
            const Icon = item.icon
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                <span>{item.name}</span>
              </Link>
            )
          })}
        </nav>

        <div className="rounded-xl border border-border/80 bg-muted/40 p-3.5 text-xs text-muted-foreground">
          <p className="font-medium text-foreground mb-1">General Educational Use</p>
          <p className="text-[11px] leading-relaxed">
            Data is strictly user-entered and private. Does not connect to real banks.
          </p>
        </div>
      </div>
    </aside>
  )
}
