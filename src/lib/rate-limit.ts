import { NextResponse } from "next/server"

type Bucket = { count: number; resetAt: number }

const globalBuckets = globalThis as unknown as {
  financeRateLimitBuckets?: Map<string, Bucket>
}

const buckets = globalBuckets.financeRateLimitBuckets ?? new Map<string, Bucket>()
globalBuckets.financeRateLimitBuckets = buckets

export function configuredLimit(name: "RATE_LIMIT_LOGIN_MAX" | "RATE_LIMIT_WEBHOOK_MAX", fallback: number) {
  const value = Number(process.env[name])
  return Number.isInteger(value) && value > 0 ? value : fallback
}

export function getClientAddress(request: { headers?: Headers | Record<string, unknown> }): string {
  const headers = request.headers
  const read = (name: string): string | null => {
    if (!headers) return null
    if (headers instanceof Headers) return headers.get(name)
    const value = headers[name] ?? headers[name.toLowerCase()]
    if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : null
    return typeof value === "string" ? value : null
  }

  return read("x-forwarded-for")?.split(",")[0]?.trim() || read("x-real-ip") || "unknown"
}

export function checkRateLimit(
  namespace: string,
  identity: string,
  limit: number,
  windowMs: number
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now()
  const key = `${namespace}:${identity}`
  const current = buckets.get(key)

  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { allowed: true, retryAfterSeconds: 0 }
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    }
  }

  current.count += 1
  return { allowed: true, retryAfterSeconds: 0 }
}

export function rateLimitResponse(retryAfterSeconds: number) {
  return NextResponse.json(
    { message: "Too many requests. Please try again shortly." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  )
}
