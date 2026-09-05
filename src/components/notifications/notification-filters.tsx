"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, CheckCheck, Trash2 } from "lucide-react"

interface NotificationFiltersProps {
  activeTab: "ALL" | "UNREAD"
  onTabChange: (tab: "ALL" | "UNREAD") => void
  selectedType: string
  onTypeChange: (type: string) => void
  search: string
  onSearchChange: (search: string) => void
  unreadCount: number
  totalCount: number
  onMarkAllRead: () => void
  onClearRead: () => void
}

export function NotificationFilters({
  activeTab,
  onTabChange,
  selectedType,
  onTypeChange,
  search,
  onSearchChange,
  unreadCount,
  totalCount,
  onMarkAllRead,
  onClearRead,
}: NotificationFiltersProps) {
  const typeOptions = [
    { value: "ALL", label: "All Types" },
    { value: "BUDGET_ALERT", label: "Budget Alerts" },
    { value: "RECURRING_PROCESSED", label: "Recurring Flows" },
    { value: "GOAL_MILESTONE", label: "Goal Milestones" },
    { value: "FINANCIAL_INSIGHT", label: "Financial Insights" },
  ]

  return (
    <div className="space-y-4">
      {/* Top Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border/60 text-xs">
          <Button
            variant={activeTab === "ALL" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs"
            onClick={() => onTabChange("ALL")}
          >
            All ({totalCount})
          </Button>
          <Button
            variant={activeTab === "UNREAD" ? "default" : "ghost"}
            size="sm"
            className="h-7 px-3 text-xs gap-1.5"
            onClick={() => onTabChange("UNREAD")}
          >
            <span>Unread</span>
            {unreadCount > 0 && (
              <span className="h-4 min-w-4 px-1 rounded-full bg-primary-foreground text-primary text-[10px] font-bold flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>
        </div>

        {/* Global Bulk Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllRead}
            disabled={unreadCount === 0}
            className="h-8 text-xs gap-1.5 shadow-xs"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            <span>Mark all read</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearRead}
            className="h-8 text-xs text-muted-foreground hover:text-destructive gap-1.5"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Clear read</span>
          </Button>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Search notification messages..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {typeOptions.map((opt) => (
            <Button
              key={opt.value}
              variant={selectedType === opt.value ? "secondary" : "ghost"}
              size="sm"
              onClick={() => onTypeChange(opt.value)}
              className={`h-8 px-2.5 text-xs whitespace-nowrap ${
                selectedType === opt.value ? "font-semibold border border-border" : "text-muted-foreground"
              }`}
            >
              {opt.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
