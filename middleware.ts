import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js Middleware for Route Protection
 *
 * Handles authentication and authorization:
 * - Unauthenticated users are redirected to /login for protected routes
 * - Challenger role users can only access landing page (no dashboard/admin)
 * - Client role users can access /dashboard/* but not /admin/*
 * - Admin role users can access both /dashboard/* and /admin/*
 * - Refreshes session on each request
 */

// Routes that require authentication
const protectedRoutes = ["/dashboard", "/admin"];

// Routes that only admins can access
const adminRoutes = ["/admin"];

// Routes that require client or admin role (challengers cannot access)
const clientRoutes = ["/dashboard"];

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Skip auth if Supabase is not configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Allow all requests if Supabase is not configured
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session (do not remove this line)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Check if the current path is a protected route
  const isProtectedRoute = protectedRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Check if the current path is an admin-only route
  const isAdminRoute = adminRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redirect unauthenticated users to login
  if (isProtectedRoute && !user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Check if the current path is a client route (requires client or admin role)
  const isClientRoute = clientRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  // For protected routes that require specific roles, fetch user profile
  if ((isAdminRoute || isClientRoute) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_deactivated")
      .eq("id", user.id)
      .single();

    const role = profile?.role ?? "challenger";
    const isDeactivated = profile?.is_deactivated ?? false;

    // Block deactivated users from all protected routes (except admins)
    if (isDeactivated && role !== "admin") {
      // Sign out the deactivated user and redirect to login
      await supabase.auth.signOut();
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("error", "account_deactivated");
      return NextResponse.redirect(loginUrl);
    }

    // Block challengers from dashboard routes
    if (isClientRoute && role === "challenger") {
      // Redirect challengers to landing page with upgrade required message
      const landingUrl = new URL("/", request.url);
      landingUrl.searchParams.set("error", "upgrade_required");
      return NextResponse.redirect(landingUrl);
    }

    // Block non-admins from admin routes
    if (isAdminRoute && role !== "admin") {
      // Redirect non-admin users to appropriate page
      if (role === "challenger") {
        const landingUrl = new URL("/", request.url);
        landingUrl.searchParams.set("error", "Access denied");
        return NextResponse.redirect(landingUrl);
      }
      const dashboardUrl = new URL("/dashboard", request.url);
      dashboardUrl.searchParams.set("error", "Access denied");
      return NextResponse.redirect(dashboardUrl);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     * - api routes (handled separately)
     */
    "/((?!_next/static|_next/image|favicon.ico|images|api).*)",
  ],
};
