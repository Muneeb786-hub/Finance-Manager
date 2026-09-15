export class ApiError extends Error {
  constructor(message: string, public status: number, public fieldErrors?: Record<string, string[]>) {
    super(message)
    this.name = "ApiError"
  }
}

export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
  const response = await fetch(input, init)
  const data = await response.json().catch(() => ({})) as { message?: string; errors?: Record<string, string[]> }
  if (!response.ok) throw new ApiError(data.message || `Request failed (${response.status})`, response.status, data.errors)
  return data as T
}
