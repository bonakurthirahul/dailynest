import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasSufficientOwnerCredits } from "@/lib/auth/credits";

// Owner area is protected here for a clean UX redirect, but this is NOT the
// security boundary. Every owner page ALSO calls requireOwner() on the
// server, and every owner API handler re-verifies the session + role before
// touching data. Middleware is bypassable in ways route handlers are not.

const OWNER_PREFIX = "/store-control-7x9";
const OWNER_LOGIN = "/store-control-7x9/login";
const OWNER_SETUP = "/store-control-7x9/setup";
const OWNER_DASHBOARD = "/store-control-7x9/dashboard";
const OWNER_OUT_OF_CREDITS = "/store-control-7x9/out-of-credits";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Misconfiguration: let the route layer surface a clear error rather
    // than silently allowing access.
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh the auth session (required for Server Components).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;

  // --- Owner area guard -------------------------------------------------
  if (path.startsWith(OWNER_PREFIX)) {
    // Login, setup, and the out-of-credits notice stay reachable without a
    // sufficient balance; everything else needs a session + credits.
    const isPublicOwnerRoute =
      path === OWNER_LOGIN || path === OWNER_SETUP || path === OWNER_OUT_OF_CREDITS;

    if (!isPublicOwnerRoute) {
      if (!user) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = OWNER_LOGIN;
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }

      // Extra layer: confirm role server-side via a lightweight RLS-scoped
      // query. If the caller is not the owner, send them away.
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, credits")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role !== "owner") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = "/";
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }

      // Credits gate: owner without a sufficient balance sees the notice page.
      if (!hasSufficientOwnerCredits(profile?.credits)) {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = OWNER_OUT_OF_CREDITS;
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    } else if (user && path === OWNER_LOGIN) {
      // Already signed in as owner -> skip the login form (unless the
      // credits gate blocks them, in which case show the notice page).
      const { data: profile } = await supabase
        .from("profiles")
        .select("role, credits")
        .eq("id", user.id)
        .maybeSingle();

      if (profile?.role === "owner") {
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = hasSufficientOwnerCredits(profile?.credits)
          ? OWNER_DASHBOARD
          : OWNER_OUT_OF_CREDITS;
        redirectUrl.search = "";
        return NextResponse.redirect(redirectUrl);
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on everything except static assets so the session stays fresh.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};

