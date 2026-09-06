"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, PiggyBank, Target, ArrowUpRight, Zap } from "lucide-react"

interface QuickActionsProps {
  onAddTransaction?: () => void
  onSimulateBankSync?: () => void
}

export function QuickActions({ onAddTransaction, onSimulateBankSync }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {onAddTransaction ? (
        <Button onClick={onAddTransaction} size="sm" className="gap-1.5 shadow-sm">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      ) : (
        <Link href="/transactions">
          <Button size="sm" className="gap-1.5 shadow-sm">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
      )}

      {onSimulateBankSync && (
        <Button
          variant="outline"
          size="sm"
          onClick={onSimulateBankSync}
          className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10"
          title="Simulate incoming charge from Credit Card, Easypaisa, or Bank"
        >
          <Zap className="h-4 w-4 text-primary" />
          Sync Card / Bank
        </Button>
      )}

      <Link href="/budgets">
        <Button variant="outline" size="sm" className="gap-1.5 border-border/80">
          <PiggyBank className="h-4 w-4 text-muted-foreground" />
          Set Budget
        </Button>
      </Link>

      <Link href="/goals">
        <Button variant="outline" size="sm" className="gap-1.5 border-border/80">
          <Target className="h-4 w-4 text-muted-foreground" />
          New Goal
        </Button>
      </Link>
    </div>
  )
}
