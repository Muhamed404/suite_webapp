import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  console.log("Middleware triggered for:::::::::::::::::::::");
  const { method, url, nextUrl } = request;
  const ip = request.headers.get("x-forwarded-for") || "unknown";
  const userAgent = request.headers.get("user-agent") || "unknown";

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/awm|contents|_next/static|_next/image|favicon.ico).*)"],
};
