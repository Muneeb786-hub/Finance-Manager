import { describe, expect, it } from "vitest"
import { importFingerprint, parseCsv } from "@/lib/csv-import"

describe("CSV transaction import", () => {
  it("parses quoted commas and escaped quotes", () => {
    const rows = parseCsv('date,type,amount,category,description\n2026-09-01,EXPENSE,12.50,Food,"Coffee, large ""special"""')
    expect(rows).toHaveLength(1)
    expect(rows[0].description).toBe('Coffee, large "special"')
  })

  it("creates stable duplicate fingerprints", () => {
    const row = { type: "EXPENSE", amount: 0.1, date: new Date("2026-09-01T00:00:00Z"), description: "Coffee", categoryId: "food" }
    expect(importFingerprint("user", row)).toBe(importFingerprint("user", { ...row }))
    expect(importFingerprint("other", row)).not.toBe(importFingerprint("user", row))
  })
})
