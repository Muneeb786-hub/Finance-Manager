import { describe, expect, it } from "vitest"
import { getZonedMonthRange, getZonedYearMonth, isValidTimeZone } from "@/lib/dates"

describe("timezone-aware reporting periods", () => {
  it("maps the same instant to the user's local month", () => {
    const instant = new Date("2026-09-30T20:30:00.000Z")
    expect(getZonedYearMonth(instant, "UTC")).toEqual({ year: 2026, month: 9 })
    expect(getZonedYearMonth(instant, "Asia/Karachi")).toEqual({ year: 2026, month: 10 })
  })

  it("returns UTC bounds for a local calendar month", () => {
    const range = getZonedMonthRange(2026, 9, "Asia/Karachi")
    expect(range.start.toISOString()).toBe("2026-08-31T19:00:00.000Z")
    expect(range.end.toISOString()).toBe("2026-09-30T18:59:59.999Z")
  })

  it("validates IANA timezone names", () => {
    expect(isValidTimeZone("America/New_York")).toBe(true)
    expect(isValidTimeZone("Not/A_Zone")).toBe(false)
  })
})
