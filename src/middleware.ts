import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const requestHeaders = new Headers(req.headers)
    const requestId = requestHeaders.get("x-request-id") || crypto.randomUUID()
    requestHeaders.set("x-request-id", requestId)
    const response = NextResponse.next({ request: { headers: requestHeaders } })
    response.headers.set("x-request-id", requestId)
    response.headers.set("x-content-type-options", "nosniff")
    response.headers.set("referrer-policy", "same-origin")
    response.headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()")
    return response
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: "/login",
    },
  }
)

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/transactions/:path*",
    "/budgets/:path*",
    "/goals/:path*",
    "/recurring/:path*",
    "/analytics/:path*",
    "/insights/:path*",
    "/notifications/:path*",
    "/settings/:path*",
    "/assets/:path*",
  ],
}
