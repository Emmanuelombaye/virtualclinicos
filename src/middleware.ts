import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE = "vco_session";
const PUBLIC_PREFIXES = [
  "/login",
  "/forgot-password",
  "/reset-password",
  "/api/v1/health",
  "/invite",
  "/api/v1/invitations/accept",
  "/api/auth/sso/",
];

function secretKey() {
  const secret = process.env.AUTH_SECRET ?? "vco-dev-secret-change-me";
  return new TextEncoder().encode(secret);
}

function isPublic(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (isPublic(pathname)) {
    if (pathname === "/login") {
      const token = request.cookies.get(COOKIE)?.value;
      if (token) {
        try {
          await jwtVerify(token, secretKey());
          return NextResponse.redirect(
            new URL("/command-center", request.url),
          );
        } catch {
          /* fall through */
        }
      }
    }
    return NextResponse.next();
  }

  // Let v1 routes authenticate via Bearer API key inside handlers
  const authHeader = request.headers.get("authorization");
  if (
    pathname.startsWith("/api/v1/") &&
    authHeader?.toLowerCase().startsWith("bearer ")
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get(COOKIE)?.value;
  let authed = false;
  if (token) {
    try {
      await jwtVerify(token, secretKey());
      authed = true;
    } catch {
      authed = false;
    }
  }

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const url = new URL("/login", request.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
