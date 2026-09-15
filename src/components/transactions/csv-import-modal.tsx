"use client"

import * as React from "react"
import { Upload, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

type Preview = {
  row: number
  status: "READY" | "INVALID" | "DUPLICATE"
  errors: string[]
  raw: Record<string, string>
}

export function CsvImportModal({ open, onOpenChange, onImported }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onImported: () => void
}) {
  const [csv, setCsv] = React.useState("")
  const [preview, setPreview] = React.useState<Preview[]>([])
  const [counts, setCounts] = React.useState({ total: 0, ready: 0, invalid: 0, duplicates: 0 })
  const [loading, setLoading] = React.useState(false)

  const chooseFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setCsv(await file.text())
    setPreview([])
  }

  const submit = async (confirm: boolean) => {
    setLoading(true)
    try {
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv, confirm }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || "CSV import failed")
      if (!confirm) {
        setPreview(data.preview)
        setCounts(data.counts)
      } else {
        toast.success(data.message)
        onImported()
        onOpenChange(false)
        setCsv("")
        setPreview([])
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "CSV import failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Required headers: date, type, amount, category, description. Optional: account, paymentMethod, tags.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="csv-file">CSV file</Label>
            <input id="csv-file" type="file" accept=".csv,text/csv" onChange={chooseFile} className="block w-full text-sm" />
          </div>
          {preview.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {counts.ready} ready · {counts.duplicates} duplicates skipped · {counts.invalid} invalid
              </p>
              <div className="max-h-64 overflow-auto rounded-md border">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-muted"><tr><th className="p-2 text-left">Row</th><th className="p-2 text-left">Description</th><th className="p-2 text-left">Status</th></tr></thead>
                  <tbody>{preview.map((row) => (
                    <tr key={row.row} className="border-t">
                      <td className="p-2">{row.row}</td>
                      <td className="p-2">{row.raw.description || row.errors.join(", ")}</td>
                      <td className="p-2 font-medium">{row.status}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          {preview.length === 0 ? (
            <Button disabled={!csv || loading} onClick={() => submit(false)}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}Preview import
            </Button>
          ) : (
            <Button disabled={counts.ready === 0 || counts.invalid > 0 || loading} onClick={() => submit(true)}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}Confirm {counts.ready} rows
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
