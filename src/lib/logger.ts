type LogContext = Record<string, string | number | boolean | null | undefined>

function safeContext(context: LogContext) {
  const blocked = /password|secret|token|raw|message|amount/i
  return Object.fromEntries(Object.entries(context).filter(([key]) => !blocked.test(key)))
}

export function requestId(request?: Request) {
  return request?.headers.get("x-request-id") || crypto.randomUUID()
}

export function logError(event: string, error: unknown, context: LogContext = {}) {
  console.error(JSON.stringify({
    level: "error",
    event,
    error: error instanceof Error ? error.name : "UnknownError",
    ...safeContext(context),
  }))
}
