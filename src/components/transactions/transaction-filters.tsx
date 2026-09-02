"use client"

import * as React from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Search,
  Filter,
  Download,
  RotateCcw,
  ArrowUpDown,
  Calendar,
} from "lucide-react"

interface Category {
  id: string
  name: string
  type: string
}

interface FilterValues {
  search: string
  type: string
  categoryId: string
  paymentMethod: string
  startDate: string
  endDate: string
  minAmount: string
  maxAmount: string
  sortBy: string
  sortOrder: "asc" | "desc"
}

interface TransactionFiltersProps {
  filters: FilterValues
  categories: Category[]
  onFilterChange: (newFilters: Partial<FilterValues>) => void
  onReset: () => void
  onExportCSV: () => void
  isExporting: boolean
}

export function TransactionFilters({
  filters,
  categories,
  onFilterChange,
  onReset,
  onExportCSV,
  isExporting,
}: TransactionFiltersProps) {
  const [showAdvanced, setShowAdvanced] = React.useState(false)

  return (
    <div className="space-y-3 bg-card border border-border/80 rounded-xl p-4 shadow-sm">
      {/* Primary search and quick filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search description, category, payment method..."
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="">All Types</option>
            <option value="EXPENSE">Expenses Only</option>
            <option value="INCOME">Income Only</option>
          </select>

          {/* Category Filter */}
          <select
            value={filters.categoryId}
            onChange={(e) => onFilterChange({ categoryId: e.target.value })}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring max-w-[150px]"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Sort Selector */}
          <select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split("-") as [string, "asc" | "desc"]
              onFilterChange({ sortBy, sortOrder })
            }}
            className="h-9 px-3 rounded-lg border border-input bg-background text-xs font-medium focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
            <option value="category-asc">Category (A-Z)</option>
          </select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="h-9 px-2.5 text-xs gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Filters</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onExportCSV}
            disabled={isExporting}
            className="h-9 px-3 text-xs gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{isExporting ? "Exporting..." : "CSV"}</span>
          </Button>
        </div>
      </div>

      {/* Advanced Filter Expansion */}
      {showAdvanced && (
        <div className="pt-3 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Start Date
            </label>
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => onFilterChange({ startDate: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              End Date
            </label>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => onFilterChange({ endDate: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Min Amount ($)
            </label>
            <Input
              type="number"
              placeholder="0.00"
              value={filters.minAmount}
              onChange={(e) => onFilterChange({ minAmount: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          <div>
            <label className="text-[11px] font-medium text-muted-foreground block mb-1">
              Max Amount ($)
            </label>
            <Input
              type="number"
              placeholder="10000.00"
              value={filters.maxAmount}
              onChange={(e) => onFilterChange({ maxAmount: e.target.value })}
              className="h-8 text-xs"
            />
          </div>

          <div className="sm:col-span-2 md:col-span-4 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onReset}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="h-3 w-3" /> Reset Filters
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
