import crypto from "crypto"

export type CsvRow = Record<string, string>

function parseLine(line: string): string[] {
  const cells: string[] = []
  let value = ""
  let quoted = false
  for (let index = 0; index < line.length; index++) {
    const character = line[index]
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        value += '"'
        index++
      } else {
        quoted = !quoted
      }
    } else if (character === "," && !quoted) {
      cells.push(value.trim())
      value = ""
    } else {
      value += character
    }
  }
  cells.push(value.trim())
  return cells
}

export function parseCsv(csv: string): CsvRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim())
  if (lines.length < 2) return []
  const headers = parseLine(lines[0]).map((header) => header.trim().toLowerCase())
  return lines.slice(1).map((line) => {
    const values = parseLine(line)
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]))
  })
}

export function importFingerprint(userId: string, row: {
  type: string
  amount: number
  date: Date
  description: string
  categoryId: string
  accountId?: string | null
}) {
  return crypto.createHash("sha256").update([
    userId,
    row.type,
    row.amount.toFixed(4),
    row.date.toISOString(),
    row.description.trim().toLowerCase(),
    row.categoryId,
    row.accountId || "",
  ].join("|")).digest("hex")
}
