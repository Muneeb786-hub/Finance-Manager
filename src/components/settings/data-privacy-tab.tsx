"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Database, Download, AlertTriangle, ShieldCheck, Trash2, Sparkles } from "lucide-react"

interface DataPrivacyTabProps {
  onDataWiped: () => void
}

export function DataPrivacyTab({ onDataWiped }: DataPrivacyTabProps) {
  const [isWipeModalOpen, setIsWipeModalOpen] = useState(false)
  const [confirmationPhrase, setConfirmationPhrase] = useState("")
  const [isWiping, setIsWiping] = useState(false)
  const [wipeError, setWipeError] = useState<string | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isSeedingDemo, setIsSeedingDemo] = useState(false)
  const [seedSuccess, setSeedSuccess] = useState(false)

  const handleExportData = async () => {
    setIsExporting(true)
    try {
      const res = await fetch("/api/account-data")
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `finance_manager_backup_${new Date().toISOString().split("T")[0]}.json`
        document.body.appendChild(a)
        a.click()
        a.remove()
        window.URL.revokeObjectURL(url)
      } else {
        alert("Failed to export backup data.")
      }
    } catch (err) {
      alert("A network error occurred while downloading backup.")
    } finally {
      setIsExporting(false)
    }
  }

  const handleSeedDemoData = async () => {
    setIsSeedingDemo(true)
    setSeedSuccess(false)
    try {
      const res = await fetch("/api/onboarding/seed-demo", { method: "POST" })
      if (res.ok) {
        setSeedSuccess(true)
        onDataWiped()
        setTimeout(() => setSeedSuccess(false), 4000)
      } else {
        alert("Failed to seed sandbox data.")
      }
    } catch (err) {
      alert("A network error occurred while loading sandbox data.")
    } finally {
      setIsSeedingDemo(false)
    }
  }

  const handleExecuteWipe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (confirmationPhrase !== "DELETE MY DATA") {
      setWipeError('Confirmation phrase must match "DELETE MY DATA" exactly.')
      return
    }

    setIsWiping(true)
    setWipeError(null)

    try {
      const res = await fetch("/api/account-data", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirmationPhrase }),
      })

      if (res.ok) {
        setIsWipeModalOpen(false)
        setConfirmationPhrase("")
        onDataWiped()
      } else {
        const data = await res.json()
        setWipeError(data.message || "Failed to wipe data.")
      }
    } catch (err) {
      setWipeError("A network error occurred.")
    } finally {
      setIsWiping(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Backup & Export Card */}
      <Card className="border-border shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">Data Backup &amp; Portability</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Download a comprehensive snapshot of your financial records, transactions, budgets, and savings ledgers
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card/60">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Export Complete JSON Backup</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Includes all accounts, categories, itemized transactions, budgets, goals, recurring schedules, and notifications in standard JSON format.
              </p>
            </div>

            <Button
              onClick={handleExportData}
              disabled={isExporting}
              size="sm"
              className="h-9 gap-1.5 text-xs shrink-0 shadow-xs"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Generating..." : "Download Backup"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sandbox Demo Data Card */}
      <Card className="border-primary/30 bg-primary/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Demo Sandbox Mode</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Quickly populate realistic sample transactions, category budgets, savings goals, and recurring rules for testing
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {seedSuccess && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
              Demo sandbox records loaded successfully! Check your Dashboard and Analytics.
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-primary/20 bg-card">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Populate Realistic Sample Records</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Appends 3 months of salary, groceries, utilities, rent, active budgets, and savings milestones so all charts and health indicators display live metrics.
              </p>
            </div>

            <Button
              onClick={handleSeedDemoData}
              disabled={isSeedingDemo}
              size="sm"
              className="h-9 gap-1.5 text-xs shrink-0 shadow-xs"
            >
              <Sparkles className="h-4 w-4" />
              {isSeedingDemo ? "Seeding..." : "Load Sample Sandbox"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone: Account Data Wipe */}
      <Card className="border-rose-500/30 bg-rose-500/5 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" />
            <CardTitle className="text-base font-semibold">Danger Zone: Data Reset</CardTitle>
          </div>
          <CardDescription className="text-xs text-rose-600/80 dark:text-rose-400/80">
            Irreversible actions affecting your recorded transactions and financial history
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-rose-500/20 bg-background">
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-foreground">Wipe All Financial Data</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Permanently wipes all transactions, accounts, active budgets, savings goals, recurring rules, and insight history. Your user account and default categories will be retained.
              </p>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setConfirmationPhrase("")
                setWipeError(null)
                setIsWipeModalOpen(true)
              }}
              className="h-9 gap-1.5 text-xs shrink-0 shadow-xs"
            >
              <Trash2 className="h-4 w-4" />
              Wipe Account Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Double Confirmation Wipe Modal */}
      <Dialog open={isWipeModalOpen} onOpenChange={setIsWipeModalOpen}>
        <DialogContent className="sm:max-w-md border-rose-500/40">
          <DialogHeader>
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-1">
              <AlertTriangle className="h-5 w-5" />
              <DialogTitle className="text-base font-semibold">Confirm Financial Data Wipe</DialogTitle>
            </div>
            <DialogDescription className="text-xs leading-relaxed text-muted-foreground">
              This action is <span className="font-bold text-rose-600">permanent and cannot be undone</span>. All transactions, recurring schedules, and savings goals will be permanently deleted from the database.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleExecuteWipe} className="space-y-4 pt-2">
            {wipeError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 text-xs">
                {wipeError}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="confirmWipe" className="text-xs">
                To proceed, type <span className="font-mono font-bold select-all text-foreground">DELETE MY DATA</span> below:
              </Label>
              <Input
                id="confirmWipe"
                value={confirmationPhrase}
                onChange={(e) => setConfirmationPhrase(e.target.value)}
                placeholder="DELETE MY DATA"
                autoComplete="off"
                required
                className="h-9 text-xs font-mono border-rose-500/40 focus-visible:ring-rose-500"
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsWipeModalOpen(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="destructive"
                size="sm"
                disabled={isWiping || confirmationPhrase !== "DELETE MY DATA"}
                className="text-xs"
              >
                {isWiping ? "Wiping data..." : "Confirm & Delete Everything"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
