"use client"

import * as React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Plus, PiggyBank, Target, ArrowUpRight } from "lucide-react"

interface QuickActionsProps {
  onAddTransaction?: () => void
}

export function QuickActions({ onAddTransaction }: QuickActionsProps) {
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
