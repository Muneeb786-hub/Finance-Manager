import { Prisma, PrismaClient } from "@prisma/client"

// Prisma serializes Decimal values as strings by default. The public API historically
// returns JSON numbers, so preserve that contract in one place while retaining exact
// fixed-precision values in PostgreSQL and Decimal arithmetic on the server.
Object.defineProperty(Prisma.Decimal.prototype, "toJSON", {
  value(this: Prisma.Decimal) {
    return this.toNumber()
  },
})

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  })

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db
