import { NextResponse, type NextRequest } from "next/server";

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const sessionCookie =
    request.cookies.get("better-auth.session_token") ||
    request.cookies.get("__Secure-better-auth.session_token");

  const isAuthenticated = Boolean(sessionCookie?.value);

  const protectedPaths = [
    "/dashboard",
    "/projects",
    "/booth",
    "/settings",
    "/legacy-booth",
  ];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  const isAuthRoute =
    pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup");

  if (isProtected && !isAuthenticated) {
    const signInUrl = new URL("/auth/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/projects/:path*",
    "/booth/:path*",
    "/settings/:path*",
    "/legacy-booth/:path*",
    "/auth/:path*",
  ],
};
