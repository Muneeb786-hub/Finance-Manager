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
import { Loader2, AlertTriangle } from "lucide-react"
import { toast } from "sonner"

interface DeleteConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  transactionId?: string | null
  bulkIds?: string[]
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onSuccess,
  transactionId,
  bulkIds = [],
}: DeleteConfirmModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const isBulk = bulkIds.length > 0
  const count = isBulk ? bulkIds.length : 1

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      if (isBulk) {
        const res = await fetch("/api/transactions/bulk", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: bulkIds }),
        })
        if (!res.ok) throw new Error("Failed to delete selected transactions")
        toast.success(`Deleted ${count} transactions`)
      } else if (transactionId) {
        const res = await fetch(`/api/transactions/${transactionId}`, {
          method: "DELETE",
        })
        if (!res.ok) throw new Error("Failed to delete transaction")
        toast.success("Transaction deleted")
      }

      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-2">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <DialogTitle className="text-center">
            {isBulk ? `Delete ${count} Transactions?` : "Delete Transaction?"}
          </DialogTitle>
          <DialogDescription className="text-center">
            This action cannot be undone. {isBulk ? "These records" : "This record"} will be permanently removed from your personal ledger.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-center pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
              </>
            ) : (
              "Confirm Delete"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
