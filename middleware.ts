import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  // Allow access to uploaded files
  if (request.nextUrl.pathname.startsWith('/uploads/')) {
    return NextResponse.next();
  }

  // Allow access to API routes
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  const isAuth = !!token;
  const isAuthPage =
    request.nextUrl.pathname.startsWith("/signin") ||
    request.nextUrl.pathname.startsWith("/register");

  // Check token expiration
  if (token) {
    const tokenExp = token.exp as number;
    const now = Math.floor(Date.now() / 1000);
    
    // If token is expired
    if (tokenExp - now <= 0) {
      // Clear all auth-related cookies
      const response = NextResponse.redirect(new URL("/signin", request.url));
      response.cookies.delete("next-auth.session-token");
      response.cookies.delete("next-auth.callback-url");
      response.cookies.delete("next-auth.csrf-token");
      return response;
    }
  }

  if (isAuthPage) {
    if (isAuth) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (!isAuth && request.nextUrl.pathname.startsWith("/dashboard")) {
    const signInUrl = new URL("/signin", request.url);
    signInUrl.searchParams.set("callbackUrl", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    "/dashboard/:path*", 
    "/signin", 
    "/register", 
    "/uploads/:path*",
    "/api/auth/:path*"
  ],
}; 