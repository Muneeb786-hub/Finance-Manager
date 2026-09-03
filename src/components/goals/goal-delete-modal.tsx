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
import { GoalData } from "./goal-card"

interface GoalDeleteModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  goal: GoalData | null
}

export function GoalDeleteModal({
  isOpen,
  onClose,
  onSuccess,
  goal,
}: GoalDeleteModalProps) {
  const [isDeleting, setIsDeleting] = React.useState(false)

  const handleDelete = async () => {
    if (!goal) return
    setIsDeleting(true)
    try {
      const res = await fetch(`/api/goals/${goal.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.message || "Failed to delete savings goal")
      }

      toast.success("Savings goal deleted successfully")
      onSuccess()
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to delete goal")
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Savings Goal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete{" "}
            <span className="font-semibold text-foreground">{goal?.title}</span>? This will also remove
            all historical contribution records associated with this goal.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:gap-0 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Goal
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
