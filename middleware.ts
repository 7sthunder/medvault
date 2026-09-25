import { NextRequest, NextResponse } from "next/server";

/**
 * Injects the requested path as `x-pathname` so server components can read it
 * (e.g. `requireUser` preserving `?next=…`). Pure pass-through — no routing here.
 */
export function middleware(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
