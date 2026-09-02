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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { BudgetData } from "./budget-card"

interface BudgetDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  budget: BudgetData | null
}

export function BudgetDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  budget,
}: BudgetDeleteModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!budget) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/budgets/${budget.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to delete budget")
      }

      toast.success("Budget removed successfully")
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.message || "Failed to delete budget")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Budget</DialogTitle>
          <DialogDescription>
            Are you sure you want to remove the monthly budget for{" "}
            <span className="font-semibold text-foreground">
              {budget?.category?.name || "this category"}
            </span>
            ? This action will not delete your past transactions.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Budget
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
