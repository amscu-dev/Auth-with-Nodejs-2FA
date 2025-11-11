import { NextRequest, NextResponse } from "next/server";
import PROTECTED_ROUTES_PREFIX from "./routes/protected-routes";
import AUTHENTICATION_ROUTES_PREFIX from "./routes/authentication-routes";
import { validateAccessToken } from "./security/authenticateAccessToken";

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const { nextUrl } = request;

  const accessToken = request.cookies.get("accessToken")?.value;

  const isProtectedRoute = nextUrl.pathname.startsWith(PROTECTED_ROUTES_PREFIX);
  const isAuthenticationRoute = nextUrl.pathname.startsWith(
    AUTHENTICATION_ROUTES_PREFIX
  );

  // CASE 01:
  if (isProtectedRoute && !accessToken) {
    console.log(`Hit protected route: ${isProtectedRoute}`);
    return Response.redirect(
      new URL(
        `/accounts/refresh?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`,
        nextUrl
      )
    );
  }
  // CASE 02:
  if (isProtectedRoute && accessToken) {
    console.log(`Hit protected route: ${isProtectedRoute}`);
    const isUserAuthenticated = await validateAccessToken({ jwt: accessToken });
    if (!isUserAuthenticated)
      return Response.redirect(
        new URL(
          `/accounts/refresh?callbackUrl=${encodeURIComponent(nextUrl.pathname)}`,
          nextUrl
        )
      );
  }
  // CASE 03:
  if (isAuthenticationRoute && accessToken) {
    console.log(`Hit authentication route: ${isAuthenticationRoute}`);
    return Response.redirect(new URL("/home/dashboard", nextUrl));
  }

  return response;
}
export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
