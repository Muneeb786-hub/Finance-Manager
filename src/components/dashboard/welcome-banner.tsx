"use client"

import { useState } from "react"
import { Sparkles, Database, Play, X, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface WelcomeBannerProps {
  onStartWizard: () => void
  onSeedDemo: () => void
  isSeeding: boolean
}

export function WelcomeBanner({ onStartWizard, onSeedDemo, isSeeding }: WelcomeBannerProps) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  return (
    <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/15 via-primary/5 to-card p-5 sm:p-6 shadow-sm">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-3.5 right-3.5 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50"
        title="Dismiss welcome banner"
      >
        <X className="h-4 w-4" />
      </button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pr-6">
        <div className="flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm shrink-0">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground">
              Welcome to Personal Finance Manager!
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
              Take a quick 2-minute guided tour to set up your liquid accounts, budgets, and savings goals, or load realistic sandbox sample data to test all charts and insights immediately.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap shrink-0">
          <Button
            size="sm"
            onClick={onStartWizard}
            className="h-8.5 gap-1.5 text-xs shadow-xs"
          >
            <Play className="h-3.5 w-3.5" />
            Start Guided Tour
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onSeedDemo}
            disabled={isSeeding}
            className="h-8.5 gap-1.5 text-xs border-primary/30 bg-card hover:bg-primary/5"
          >
            <Database className="h-3.5 w-3.5 text-primary" />
            {isSeeding ? "Loading Sandbox..." : "Explore with Sandbox Data"}
          </Button>
        </div>
      </div>
    </div>
  )
}
