"use client"

import {
  Bell,
  AlertTriangle,
  Repeat,
  Target,
  Check,
  Trash2,
  Sparkles,
  Info,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export interface NotificationRecord {
  id: string
  userId: string
  type: string
  title: string
  message: string
  isRead: boolean
  createdAt: string
}

interface NotificationItemProps {
  notification: NotificationRecord
  onToggleRead: (id: string, currentStatus: boolean) => void
  onDelete: (id: string) => void
}

export function NotificationItem({
  notification,
  onToggleRead,
  onDelete,
}: NotificationItemProps) {
  const getIcon = (type: string) => {
    switch (type) {
      case "BUDGET_ALERT":
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case "RECURRING_PROCESSED":
        return <Repeat className="h-4 w-4 text-indigo-500" />
      case "GOAL_MILESTONE":
        return <Target className="h-4 w-4 text-emerald-500" />
      case "FINANCIAL_INSIGHT":
        return <Sparkles className="h-4 w-4 text-primary" />
      default:
        return <Info className="h-4 w-4 text-sky-500" />
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "BUDGET_ALERT":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 text-[10px]">Budget Alert</Badge>
      case "RECURRING_PROCESSED":
        return <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 text-[10px]">Recurring Flow</Badge>
      case "GOAL_MILESTONE":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px]">Goal Milestone</Badge>
      case "FINANCIAL_INSIGHT":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Financial Insight</Badge>
      default:
        return <Badge variant="secondary" className="text-[10px]">Notice</Badge>
    }
  }

  const formatRelativeTime = (isoString: string) => {
    const date = new Date(isoString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return "Just now"
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <div
      className={`p-4 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
        notification.isRead
          ? "border-border/60 bg-card/40 opacity-80 hover:opacity-100"
          : "border-primary/30 bg-primary/5 shadow-sm"
      }`}
    >
      <div className="flex items-start gap-3.5 flex-1 min-w-0">
        <div className="mt-0.5 p-2 rounded-lg bg-card border border-border shadow-xs shrink-0">
          {getIcon(notification.type)}
        </div>
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className={`text-sm font-semibold truncate ${notification.isRead ? "text-foreground" : "text-foreground font-bold"}`}>
              {notification.title}
            </h4>
            {getTypeLabel(notification.type)}
            {!notification.isRead && (
              <span className="h-2 w-2 rounded-full bg-primary shrink-0" title="Unread" />
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed break-words">
            {notification.message}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-0.5">
            <Clock className="h-3 w-3" />
            <span>{formatRelativeTime(notification.createdAt)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onToggleRead(notification.id, notification.isRead)}
          className="h-8 px-2.5 text-xs text-muted-foreground hover:text-foreground gap-1"
          title={notification.isRead ? "Mark as unread" : "Mark as read"}
        >
          <Check className="h-3.5 w-3.5" />
          <span>{notification.isRead ? "Unread" : "Read"}</span>
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={() => onDelete(notification.id)}
          className="h-8 w-8 text-muted-foreground hover:text-destructive"
          title="Delete notification"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  )
}
