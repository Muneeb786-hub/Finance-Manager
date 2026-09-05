"use client"

import { useState, useEffect, useCallback } from "react"
import { Bell, CheckCircle2, RefreshCw, Sparkles, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { NotificationItem, NotificationRecord } from "@/components/notifications/notification-item"
import { NotificationFilters } from "@/components/notifications/notification-filters"

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationRecord[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"ALL" | "UNREAD">("ALL")
  const [selectedType, setSelectedType] = useState("ALL")
  const [search, setSearch] = useState("")

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (activeTab === "UNREAD") params.append("unreadOnly", "true")
      if (selectedType !== "ALL") params.append("type", selectedType)
      if (search.trim()) params.append("search", search.trim())

      const res = await fetch(`/api/notifications?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
        setTotalCount(data.totalCount || 0)
      }
    } catch (err) {
      console.error("Failed to load notifications", err)
    } finally {
      setLoading(false)
    }
  }, [activeTab, selectedType, search])

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  const handleToggleRead = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: !currentStatus }),
      })
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: !currentStatus } : n))
        )
        setUnreadCount((prev) => (currentStatus ? prev + 1 : Math.max(0, prev - 1)))
      }
    } catch (err) {
      console.error("Failed to toggle read state", err)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/notifications/${id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        const deleted = notifications.find((n) => n.id === id)
        setNotifications((prev) => prev.filter((n) => n.id !== id))
        setTotalCount((prev) => Math.max(0, prev - 1))
        if (deleted && !deleted.isRead) {
          setUnreadCount((prev) => Math.max(0, prev - 1))
        }
      }
    } catch (err) {
      console.error("Failed to delete notification", err)
    }
  }

  const handleMarkAllRead = async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
      })
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })))
        setUnreadCount(0)
      }
    } catch (err) {
      console.error("Failed to mark all as read", err)
    }
  }

  const handleClearRead = async () => {
    try {
      const res = await fetch("/api/notifications?filter=read", {
        method: "DELETE",
      })
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => !n.isRead))
        setTotalCount((prev) => prev - (totalCount - unreadCount))
      }
    } catch (err) {
      console.error("Failed to clear read notifications", err)
    }
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Bell className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications &amp; Alerts</h1>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Real-time ledger alerts, recurring transaction confirmations, and budget thresholds
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchNotifications}
          disabled={loading}
          className="h-9 gap-1.5 text-xs shadow-xs self-start sm:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter and search bar */}
      <NotificationFilters
        activeTab={activeTab}
        onTabChange={setActiveTab}
        selectedType={selectedType}
        onTypeChange={setSelectedType}
        search={search}
        onSearchChange={setSearch}
        unreadCount={unreadCount}
        totalCount={totalCount}
        onMarkAllRead={handleMarkAllRead}
        onClearRead={handleClearRead}
      />

      {/* Notification List */}
      {loading && notifications.length === 0 ? (
        <div className="p-12 text-center text-xs text-muted-foreground">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-3" />
          Checking notifications inbox...
        </div>
      ) : notifications.length === 0 ? (
        <Card className="border-border shadow-sm">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h3 className="text-base font-semibold text-foreground">All caught up!</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
              {activeTab === "UNREAD"
                ? "You have no unread notifications right now."
                : search
                ? "No notifications matching your search query."
                : "Your notification inbox is clean. System notifications for budgets and recurring transactions will appear here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((item) => (
            <NotificationItem
              key={item.id}
              notification={item}
              onToggleRead={handleToggleRead}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
