"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { History, Calendar } from "lucide-react"

interface Snapshot {
  id: string
  periodStart: string
  periodEnd: string
  summary: string
  structuredData: any
  createdAt: string
}

interface SnapshotHistoryProps {
  snapshots: Snapshot[]
}

export function SnapshotHistory({ snapshots }: SnapshotHistoryProps) {
  if (snapshots.length === 0) {
    return (
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <History className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg font-bold">Saved Snapshot History</CardTitle>
          </div>
          <CardDescription>Records of generated periodic financial evaluations</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          No generated historical snapshots found. Click &quot;Save Insight Snapshot&quot; to archive the current month&apos;s evaluation.
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-bold">Saved Snapshot History</CardTitle>
        </div>
        <CardDescription>Archive of previous automated financial reviews</CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        {snapshots.map((snap) => {
          const dateStr = new Date(snap.createdAt).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })
          const score = snap.structuredData?.healthScore?.score
          const rating = snap.structuredData?.healthScore?.rating

          return (
            <div
              key={snap.id}
              className="p-3.5 rounded-lg border border-border bg-card/60 hover:bg-muted/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold text-foreground">
                    {new Date(snap.periodStart).toLocaleString("default", { month: "long", year: "numeric" })}
                  </span>
                  <span className="text-[11px] text-muted-foreground">Archived on {dateStr}</span>
                </div>
                <p className="text-muted-foreground text-[11px] leading-relaxed">
                  {snap.summary}
                </p>
              </div>

              {score !== undefined && (
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="outline" className="font-mono text-xs">
                    Score: {score}/100
                  </Badge>
                  {rating && (
                    <Badge variant="secondary" className="text-[10px]">
                      {rating}
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
