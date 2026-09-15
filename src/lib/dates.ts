type ZonedParts = { year: number; month: number; day: number; hour: number; minute: number; second: number }

function partsAt(date: Date, timeZone: string): ZonedParts {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date)
  const value = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value)
  return { year: value("year"), month: value("month"), day: value("day"), hour: value("hour"), minute: value("minute"), second: value("second") }
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone }).format()
    return true
  } catch {
    return false
  }
}

export function zonedDateTimeToUtc(
  year: number,
  month: number,
  day: number,
  timeZone: string,
  hour = 0,
  minute = 0,
  second = 0
): Date {
  let timestamp = Date.UTC(year, month - 1, day, hour, minute, second)
  for (let attempt = 0; attempt < 2; attempt++) {
    const observed = partsAt(new Date(timestamp), timeZone)
    const observedAsUtc = Date.UTC(observed.year, observed.month - 1, observed.day, observed.hour, observed.minute, observed.second)
    const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, second)
    timestamp += desiredAsUtc - observedAsUtc
  }
  return new Date(timestamp)
}

export function getZonedMonthRange(year: number, month: number, timeZone: string) {
  const nextMonth = month === 12 ? 1 : month + 1
  const nextYear = month === 12 ? year + 1 : year
  const start = zonedDateTimeToUtc(year, month, 1, timeZone)
  const nextStart = zonedDateTimeToUtc(nextYear, nextMonth, 1, timeZone)
  return { start, end: new Date(nextStart.getTime() - 1) }
}

export function getZonedYearMonth(date: Date, timeZone: string) {
  const parts = partsAt(date, timeZone)
  return { year: parts.year, month: parts.month }
}

export function getZonedDay(date: Date, timeZone: string) {
  return partsAt(date, timeZone).day
}
