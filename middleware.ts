import { NextRequest, NextResponse } from "next/server";

const COOKIE_NAME = "perez_admin";

function isAuthenticated(req: NextRequest): boolean {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  const expected = process.env.ADMIN_KEY || "perez-admin-2026";
  return token === expected;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow login page and login API
  if (pathname === "/admin/login" || pathname === "/api/admin/auth") {
    return NextResponse.next();
  }

  // Protect /admin/* and /api/admin/*
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    if (!isAuthenticated(req)) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "No autorizado" }, { status: 401 });
      }
      const loginUrl = new URL("/admin/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
