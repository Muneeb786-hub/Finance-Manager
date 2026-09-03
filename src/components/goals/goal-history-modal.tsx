"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { formatCurrency, formatDate } from "@/lib/utils"
import { GoalData } from "./goal-card"
import { ArrowDownLeft, ArrowUpRight, History, Loader2 } from "lucide-react"

interface GoalHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  goal: GoalData | null
}

interface ContributionItem {
  id: string
  amount: number
  type: "CONTRIBUTION" | "WITHDRAWAL"
  note?: string | null
  date: string
}

export function GoalHistoryModal({ isOpen, onClose, goal }: GoalHistoryModalProps) {
  const [contributions, setContributions] = React.useState<ContributionItem[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    if (!isOpen || !goal) return
    setIsLoading(true)
    fetch(`/api/goals/${goal.id}/contributions`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setContributions(data)
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false))
  }, [isOpen, goal])

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-primary" />
            Contribution History
          </DialogTitle>
          <DialogDescription>
            Deposits and withdrawals for{" "}
            <span className="font-semibold text-foreground">{goal?.title}</span>.
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {isLoading ? (
            <div className="flex h-32 items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading history...
            </div>
          ) : contributions.length === 0 ? (
            <div className="py-8 text-center text-xs text-muted-foreground">
              No transactions recorded yet for this goal.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-border/60 pr-1">
              {contributions.map((c) => {
                const isDeposit = c.type === "CONTRIBUTION"
                return (
                  <div key={c.id} className="flex items-center justify-between py-2.5 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                          isDeposit
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                        }`}
                      >
                        {isDeposit ? (
                          <ArrowDownLeft className="h-3.5 w-3.5" />
                        ) : (
                          <ArrowUpRight className="h-3.5 w-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {c.note || (isDeposit ? "Deposit" : "Withdrawal")}
                        </p>
                        <p className="text-[11px] text-muted-foreground">{formatDate(c.date)}</p>
                      </div>
                    </div>
                    <span
                      className={`font-semibold shrink-0 font-mono ${
                        isDeposit
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isDeposit ? "+" : "-"}
                      {formatCurrency(c.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
