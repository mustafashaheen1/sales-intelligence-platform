import { NextRequest, NextResponse } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/leads", "/analytics", "/outreach", "/settings", "/voice-ai"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some((path) => pathname.startsWith(path));
  if (!isProtected) return NextResponse.next();

  const sessionCookie = request.cookies.get("sales_ai_session");

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  try {
    const data = JSON.parse(Buffer.from(sessionCookie.value, "base64").toString());
    if (data.expiresAt < Date.now()) {
      const response = NextResponse.redirect(new URL("/", request.url));
      response.cookies.delete("sales_ai_session");
      return response;
    }
  } catch {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/analytics/:path*",
    "/outreach/:path*",
    "/settings/:path*",
    "/voice-ai/:path*",
  ],
};
