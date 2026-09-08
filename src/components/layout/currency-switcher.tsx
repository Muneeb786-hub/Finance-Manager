"use client"

import * as React from "react"
import { useCurrency, SUPPORTED_CURRENCIES } from "@/lib/currency-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Check, ChevronDown } from "lucide-react"

export function CurrencySwitcher() {
  const { currency, setCurrency } = useCurrency()

  const current = SUPPORTED_CURRENCIES.find((c) => c.code === currency) || SUPPORTED_CURRENCIES[1]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 px-2.5 gap-1.5 rounded-xl border-border/70 bg-card/60 hover:bg-card hover:border-primary/50 text-xs font-semibold shadow-xs transition-all tracking-tight"
          title="Switch currency"
        >
          <span className="text-sm leading-none">{current.flag}</span>
          <span className="font-bold text-foreground">{current.symbol}</span>
          <span className="text-[11px] text-muted-foreground uppercase">{current.code}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground opacity-70" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 rounded-xl p-1.5 shadow-lg border-border/80 backdrop-blur-xl bg-card/95"
      >
        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          Select Currency
        </div>
        {SUPPORTED_CURRENCIES.map((item) => {
          const isSelected = item.code === currency
          return (
            <DropdownMenuItem
              key={item.code}
              onClick={() => setCurrency(item.code)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                isSelected
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-foreground hover:bg-muted"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">{item.flag}</span>
                <span>{item.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold font-mono text-[11px] text-muted-foreground">
                  {item.symbol}
                </span>
                {isSelected && <Check className="h-3.5 w-3.5 text-primary" />}
              </div>
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
