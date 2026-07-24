import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/config/i18n";

const AUTH_COOKIE = "helia_access_token";

/** Paths under /dashboard that must never appear as /{locale}/{segment} alone. */
const DASHBOARD_SEGMENTS = new Set([
  "api-keys",
  "profile",
  "usage",
  "documentation",
  "integrations",
  "settings",
  "organizations",
  "projects",
  "helia-chat",
  "customers",
  "automation",
  "analytics",
]);

function hasAuthCookie(request: NextRequest): boolean {
  const value = request.cookies.get(AUTH_COOKIE)?.value?.trim();
  return Boolean(value);
}

function loginRedirect(request: NextRequest, nextPath: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", nextPath);
  return NextResponse.redirect(url);
}

function splitLocale(pathname: string): {
  locale: string | null;
  rest: string;
} {
  const parts = pathname.split("/").filter(Boolean);
  const first = parts[0];
  if (first && isLocale(first)) {
    const rest = "/" + parts.slice(1).join("/");
    return { locale: first, rest: rest === "/" ? "" : rest };
  }
  return { locale: null, rest: pathname };
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const authed = hasAuthCookie(request);
  const { locale, rest } = splitLocale(pathname);

  if (pathname === "/login" || pathname === "/register") {
    if (authed) {
      const next = request.nextUrl.searchParams.get("next");
      const target =
        next && next.startsWith("/") && !next.startsWith("//")
          ? next
          : `/${defaultLocale}/dashboard`;
      const url = request.nextUrl.clone();
      url.pathname = target.startsWith("/login")
        ? `/${defaultLocale}/dashboard`
        : target;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Repair invalid links like /en/api-keys → /en/dashboard/api-keys
  if (locale && rest) {
    const segment = rest.replace(/^\//, "").split("/")[0] ?? "";
    if (DASHBOARD_SEGMENTS.has(segment) && !rest.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = `/${locale}/dashboard${rest}`;
      return NextResponse.redirect(url);
    }
  }

  const isBareDashboard =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isLocalizedDashboard =
    Boolean(locale) &&
    (rest === "/dashboard" || rest.startsWith("/dashboard/"));

  if (isBareDashboard || isLocalizedDashboard) {
    if (!authed) {
      return loginRedirect(request, pathname);
    }

    // Canonicalize bare /dashboard → /{locale}/dashboard
    if (isBareDashboard) {
      const url = request.nextUrl.clone();
      url.pathname = `/${defaultLocale}${pathname}`;
      return NextResponse.redirect(url);
    }

    // Rewrite /{locale}/dashboard/* → /dashboard/* (App Router files)
    const url = request.nextUrl.clone();
    url.pathname = rest || "/dashboard";
    return NextResponse.rewrite(url);
  }

  if (pathname === "/demo" || pathname.startsWith("/demo/")) {
    return NextResponse.next();
  }

  const hasLocale = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
  );

  if (hasLocale) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname =
    pathname === "/" ? `/${defaultLocale}` : `/${defaultLocale}${pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
