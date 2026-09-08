"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import Link from "next/link"
import { ThemeToggle } from "@/components/layout/theme-toggle"
import { Button } from "@/components/ui/button"
import { Bell, LogOut, User as UserIcon, Wallet, Menu, X } from "lucide-react"
import { usePathname } from "next/navigation"

export function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)
  const [unreadCount, setUnreadCount] = React.useState(0)

  React.useEffect(() => {
    if (!session?.user) return

    const checkUnread = async () => {
      try {
        const res = await fetch("/api/notifications?unreadOnly=true")
        if (res.ok) {
          const data = await res.json()
          setUnreadCount(data.unreadCount || 0)
        }
      } catch (err) {
        // silent fail
      }
    }

    checkUnread()
    const interval = setInterval(checkUnread, 60000)
    return () => clearInterval(interval)
  }, [session?.user, pathname])

  const getPageTitle = (path: string) => {
    if (path.startsWith("/dashboard")) return "Dashboard"
    if (path.startsWith("/assets")) return "Total Net Worth & Assets"
    if (path.startsWith("/transactions")) return "Transactions"
    if (path.startsWith("/budgets")) return "Budgets"
    if (path.startsWith("/goals")) return "Savings Goals"
    if (path.startsWith("/recurring")) return "Recurring Transactions"
    if (path.startsWith("/analytics")) return "Analytics"
    if (path.startsWith("/insights")) return "Financial Insights"
    if (path.startsWith("/notifications")) return "Notifications"
    if (path.startsWith("/settings")) return "Settings"
    return "Personal Finance Manager"
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/80 px-4 sm:px-6 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-muted-foreground hover:bg-muted"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <h1 className="text-base sm:text-lg font-semibold tracking-tight">{getPageTitle(pathname)}</h1>
      </div>

      <div className="flex items-center gap-2">
        <Link href="/notifications">
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-lg text-muted-foreground hover:text-foreground">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
        </Link>
        <ThemeToggle />
        {session?.user ? (
          <div className="flex items-center gap-2 border-l border-border pl-2 ml-1">
            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold leading-tight">{session.user.name || "User"}</span>
              <span className="text-[10px] text-muted-foreground">{session.user.email}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-lg text-muted-foreground hover:text-destructive"
              onClick={() => signOut({ callbackUrl: "/login" })}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Link href="/login">
            <Button size="sm" variant="default">Sign In</Button>
          </Link>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-card border-b border-border p-4 shadow-lg flex flex-col gap-2 z-50">
          <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Dashboard</Link>
          <Link href="/assets" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Assets & Net Worth</Link>
          <Link href="/transactions" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Transactions</Link>
          <Link href="/budgets" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Budgets</Link>
          <Link href="/goals" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Goals</Link>
          <Link href="/recurring" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Recurring</Link>
          <Link href="/analytics" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Analytics</Link>
          <Link href="/insights" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Financial Insights</Link>
          <Link href="/settings" onClick={() => setMobileMenuOpen(false)} className="px-3 py-2 rounded-md hover:bg-muted text-sm font-medium">Settings</Link>
        </div>
      )}
    </header>
  )
}
