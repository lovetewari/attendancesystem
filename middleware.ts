import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname
  const path = request.nextUrl.pathname

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/attendance", "/expenses", "/reports", "/employees", "/menu"]
  const isProtectedRoute = protectedRoutes.some((route) => path === route || path.startsWith(`${route}/`))

  // Get the auth cookie
  const authCookie = request.cookies.get("admin-auth")
  const isAuthenticated = !!authCookie?.value

  // If the route is protected and the user is not authenticated, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // If the user is authenticated and trying to access login, redirect to dashboard
  if ((path === "/login" || path === "/") && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // If the user is accessing the root path, redirect to login or dashboard
  if (path === "/") {
    return NextResponse.redirect(new URL(isAuthenticated ? "/dashboard" : "/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
