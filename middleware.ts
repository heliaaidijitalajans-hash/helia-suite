import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { defaultLocale, isLocale, locales } from "@/config/i18n";

const AUTH_COOKIE = "helia_access_token";

/** Segments that belong under /dashboard, not /{locale}/{segment}. */
const DASHBOARD_SEGMENTS = new Set([
  "profile",
  "usage",
  "settings",
  "organizations",
  "projects",
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
          : "/dashboard";
      const url = request.nextUrl.clone();
      url.pathname = target.startsWith("/login") ? "/dashboard" : target;
      url.search = "";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // /en/api-keys or /tr/profile → /dashboard/api-keys or /dashboard/profile
  if (locale && rest) {
    const segment = rest.replace(/^\//, "").split("/")[0] ?? "";
    if (DASHBOARD_SEGMENTS.has(segment) && !rest.startsWith("/dashboard")) {
      const url = request.nextUrl.clone();
      url.pathname = `/dashboard${rest}`;
      return NextResponse.redirect(url);
    }
  }

  // /en/dashboard/* → /dashboard/* (real App Router pages live here)
  if (
    locale &&
    (rest === "/dashboard" || rest.startsWith("/dashboard/"))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.redirect(url);
  }

  // /en/admin → /admin
  if (locale && (rest === "/admin" || rest.startsWith("/admin/"))) {
    const url = request.nextUrl.clone();
    url.pathname = rest;
    return NextResponse.redirect(url);
  }

  if (pathname === "/dashboard" || pathname.startsWith("/dashboard/")) {
    if (!authed) {
      return loginRedirect(request, pathname);
    }
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!authed) {
      return loginRedirect(request, pathname);
    }
    return NextResponse.next();
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
