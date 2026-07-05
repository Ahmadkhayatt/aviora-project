// ====================================================================
// AVIORA — Next.js Middleware
// Protects admin routes, refreshes Supabase sessions, and enforces RBAC.
// ====================================================================

import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/middleware";

// Routes that require admin authentication
const ADMIN_ROUTES = ["/dashboard", "/dashboard/:path*"];

function isRouteProtected(pathname: string, patterns: string[]): boolean {
  return patterns.some((pattern) => {
    if (pattern.endsWith(":path*")) {
      const base = pattern.replace("/:path*", "");
      return pathname === base || pathname.startsWith(base + "/");
    }
    return pathname === pattern;
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and API auth routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/static") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/favicon") ||
    pathname === "/manifest.json"
  ) {
    return NextResponse.next();
  }

  // Strip potential spoofed headers from incoming client request
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-user-id");
  requestHeaders.delete("x-user-email");
  requestHeaders.delete("x-user-role");

  // Check if this is an admin route
  const isAdminRoute = isRouteProtected(pathname, ADMIN_ROUTES);

  // Create Supabase client via middleware helper
  const { supabase, response } = createClient(request);

  // Refresh the Supabase session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // For admin routes, verify authentication AND admin role
  if (isAdminRoute) {
    if (!user?.email) {
      // Redirect to login, preserving the intended destination
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify role against database instead of email domain
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "ADMIN") {
      // Non-admin role → redirect to home
      return NextResponse.redirect(new URL("/", request.url));
    }

    // Admin access granted — set custom header for route handlers
    requestHeaders.set("x-user-id", user.id);
    requestHeaders.set("x-user-email", user.email);
    requestHeaders.set("x-user-role", "ADMIN");
  }

  // Create final response with updated request headers
  const finalResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Preserve any session cookies updated by the Supabase client
  response.cookies.getAll().forEach((cookie) => {
    finalResponse.cookies.set(cookie.name, cookie.value);
  });

  return finalResponse;
}

export const config = {
  matcher: [
    // Apply to all routes except static files
    "/((?!_next/static|_next/image|favicon.ico|images).*)",
  ],
};
