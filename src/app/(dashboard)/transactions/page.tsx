"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { TransactionFilters } from "@/components/transactions/transaction-filters"
import { TransactionModal } from "@/components/transactions/transaction-modal"
import { DeleteConfirmModal } from "@/components/transactions/delete-confirm-modal"
import { PendingSyncBanner } from "@/components/bank-sync/pending-sync-banner"
import { formatCurrency, formatDate } from "@/lib/utils"
import { useCurrency } from "@/lib/currency-context"
import {
  Plus,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Receipt,
  ArrowDownRight,
  ArrowUpRight,
  Tag,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

export default function TransactionsPage() {
  const { format } = useCurrency()
  const [transactions, setTransactions] = React.useState<any[]>([])
  const [categories, setCategories] = React.useState<any[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [isExporting, setIsExporting] = React.useState(false)

  // Filters state
  const [filters, setFilters] = React.useState({
    search: "",
    type: "",
    categoryId: "",
    paymentMethod: "",
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    sortBy: "date",
    sortOrder: "desc" as "asc" | "desc",
  })

  // Pagination state
  const [pagination, setPagination] = React.useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1,
  })

  // Bulk selection state
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  // Modal states
  const [isTransactionModalOpen, setIsTransactionModalOpen] = React.useState(false)
  const [editingTransaction, setEditingTransaction] = React.useState<any | null>(null)
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null)
  const [isBulkDeleteOpen, setIsBulkDeleteOpen] = React.useState(false)

  // Fetch categories for filtering
  React.useEffect(() => {
    fetch("/api/categories")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data)
      })
      .catch((err) => console.error("Failed to load categories", err))
  }, [])

  // Fetch transactions based on filters & page
  const fetchTransactions = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder,
        ...(filters.search ? { search: filters.search } : {}),
        ...(filters.type ? { type: filters.type } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.paymentMethod ? { paymentMethod: filters.paymentMethod } : {}),
        ...(filters.startDate ? { startDate: filters.startDate } : {}),
        ...(filters.endDate ? { endDate: filters.endDate } : {}),
        ...(filters.minAmount ? { minAmount: filters.minAmount } : {}),
        ...(filters.maxAmount ? { maxAmount: filters.maxAmount } : {}),
      })

      const res = await fetch(`/api/transactions?${params.toString()}`)
      if (!res.ok) throw new Error("Failed to fetch transactions")

      const data = await res.json()
      setTransactions(data.transactions || [])
      setPagination((prev) => ({
        ...prev,
        total: data.pagination.total,
        totalPages: data.pagination.totalPages || 1,
      }))
      // Reset selected IDs if they are no longer in the fetched list
      setSelectedIds([])
    } catch (err: any) {
      toast.error(err.message || "Error loading transactions")
    } finally {
      setIsLoading(false)
    }
  }, [filters, pagination.page, pagination.limit])

  React.useEffect(() => {
    fetchTransactions()
  }, [fetchTransactions])

  const handleFilterChange = (newFilters: Partial<typeof filters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleResetFilters = () => {
    setFilters({
      search: "",
      type: "",
      categoryId: "",
      paymentMethod: "",
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      sortBy: "date",
      sortOrder: "desc",
    })
    setPagination((prev) => ({ ...prev, page: 1 }))
  }

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const res = await fetch("/api/transactions/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      })

      if (!res.ok) throw new Error("Export failed")

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `transactions-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success("CSV export downloaded")
    } catch (err: any) {
      toast.error(err.message || "Failed to export CSV")
    } finally {
      setIsExporting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === transactions.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(transactions.map((t) => t.id))
    }
  }

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage, filter, and track your income and expenses across accounts.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setIsBulkDeleteOpen(true)}
              className="gap-1.5 text-xs shadow-sm"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete ({selectedIds.length})
            </Button>
          )}

          <Button
            size="sm"
            onClick={() => {
              setEditingTransaction(null)
              setIsTransactionModalOpen(true)
            }}
            className="gap-1.5 text-xs shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Transaction
          </Button>
        </div>
      </div>

      {/* Pending Bank / Card Sync Transactions Banner */}
      <PendingSyncBanner onTransactionApproved={fetchTransactions} />

      {/* Filter Component */}
      <TransactionFilters
        filters={filters}
        categories={categories}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
        onExportCSV={handleExportCSV}
        isExporting={isExporting}
      />

      {/* Transactions Table Card */}
      <div className="rounded-xl border border-border/80 bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/50 border-b border-border text-muted-foreground uppercase font-semibold text-[10px] tracking-wider">
              <tr>
                <th className="p-3 w-8 text-center">
                  <input
                    type="checkbox"
                    checked={
                      transactions.length > 0 &&
                      selectedIds.length === transactions.length
                    }
                    onChange={toggleSelectAll}
                    className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                  />
                </th>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Account / Method</th>
                <th className="p-3 text-right">Amount</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-primary" />
                    <span>Loading transactions...</span>
                  </td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-muted text-muted-foreground mb-3">
                      <Receipt className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-foreground text-sm">No transactions found</p>
                    <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                      Adjust your search and filter criteria or record your first transaction to get started.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => {
                        setEditingTransaction(null)
                        setIsTransactionModalOpen(true)
                      }}
                      className="mt-4 gap-1.5 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Transaction
                    </Button>
                  </td>
                </tr>
              ) : (
                transactions.map((t) => {
                  const isExpense = t.type === "EXPENSE"
                  const isSelected = selectedIds.includes(t.id)

                  return (
                    <tr
                      key={t.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        isSelected ? "bg-primary/5" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectRow(t.id)}
                          className="rounded border-input text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                        />
                      </td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        {formatDate(t.date)}
                      </td>
                      <td className="p-3">
                        <div className="font-medium text-foreground">{t.description}</div>
                        {t.tags && t.tags.length > 0 && (
                          <div className="flex items-center gap-1 mt-1 flex-wrap">
                            {t.tags.map((tag: string) => (
                              <span
                                key={tag}
                                className="inline-flex items-center text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">
                        <Badge
                          variant="outline"
                          className="text-[11px] font-normal"
                          style={{
                            borderColor: t.category?.color || "#10b981",
                            color: t.category?.color || "#10b981",
                          }}
                        >
                          {t.category?.name || "General"}
                        </Badge>
                      </td>
                      <td className="p-3 whitespace-nowrap text-muted-foreground">
                        <div>{t.account?.name || "Cash"}</div>
                        <div className="text-[10px] opacity-75">
                          {t.paymentMethod?.replace("_", " ")}
                        </div>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap font-semibold">
                        <span
                          className={`inline-flex items-center gap-1 ${
                            isExpense
                              ? "text-rose-600 dark:text-rose-400"
                              : "text-emerald-600 dark:text-emerald-400"
                          }`}
                        >
                          {isExpense ? (
                            <ArrowDownRight className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowUpRight className="h-3.5 w-3.5" />
                          )}
                          {isExpense ? "-" : "+"}
                          {format(t.amount)}
                        </span>
                      </td>
                      <td className="p-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => {
                              setEditingTransaction(t)
                              setIsTransactionModalOpen(true)
                            }}
                            title="Edit transaction"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => setDeleteTargetId(t.id)}
                            title="Delete transaction"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {pagination.total > 0 && (
          <div className="border-t border-border/80 px-4 py-3 flex items-center justify-between text-xs text-muted-foreground">
            <div>
              Showing{" "}
              <span className="font-semibold text-foreground">
                {(pagination.page - 1) * pagination.limit + 1}
              </span>{" "}
              to{" "}
              <span className="font-semibold text-foreground">
                {Math.min(pagination.page * pagination.limit, pagination.total)}
              </span>{" "}
              of <span className="font-semibold text-foreground">{pagination.total}</span>{" "}
              transactions
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={pagination.page <= 1}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                }
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Prev
              </Button>
              <span className="text-xs">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 px-2 text-xs"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                }
              >
                Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction Modal (Add/Edit) */}
      <TransactionModal
        isOpen={isTransactionModalOpen}
        onClose={() => {
          setIsTransactionModalOpen(false)
          setEditingTransaction(null)
        }}
        onSuccess={fetchTransactions}
        initialData={editingTransaction}
      />

      {/* Single Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={!!deleteTargetId}
        onClose={() => setDeleteTargetId(null)}
        onSuccess={fetchTransactions}
        transactionId={deleteTargetId}
      />

      {/* Bulk Delete Confirm Modal */}
      <DeleteConfirmModal
        isOpen={isBulkDeleteOpen}
        onClose={() => setIsBulkDeleteOpen(false)}
        onSuccess={() => {
          setSelectedIds([])
          fetchTransactions()
        }}
        bulkIds={selectedIds}
      />
    </div>
  )
}
