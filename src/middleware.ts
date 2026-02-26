// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Check for the session cookie that NextAuth creates
  const session = request.cookies.get("authjs.session-token") ||
    request.cookies.get("__Secure-authjs.session-token");

  // If trying to access /admin and no session exists, go to login
  if (request.nextUrl.pathname.startsWith('/admin') && !session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};