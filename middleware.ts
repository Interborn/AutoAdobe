import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Allow access to uploaded files
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request });
  const isAuth = !!token;
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/signin") ||
    request.nextUrl.pathname.startsWith("/register");

  // Check token expiration
  if (token) {
    const tokenExp = token.exp as number;
    const now = Math.floor(Date.now() / 1000);
    
    // If token is expired or about to expire in the next 10 seconds
    if (tokenExp - now <= 10) {
      // Clear the token cookie
      const response = NextResponse.redirect(new URL("/signin", request.url));
      response.cookies.delete("next-auth.session-token");
      return response;
    }
  }

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return null;
  }

  if (!isAuth && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/signin", request.url));
  }

  return null;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ["/dashboard/:path*", "/signin", "/register", "/uploads/:path*"],
}; 