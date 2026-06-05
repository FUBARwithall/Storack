import { NextRequest, NextResponse } from "next/server";
import { decrypt } from "./lib/auth";

export async function middleware(request: NextRequest) {
    const session = request.cookies.get("session")?.value;
    const path = request.nextUrl.pathname;

    // Define public paths
    const isPublicPath = path === "/auth";

    if (!session && !isPublicPath) {
        return NextResponse.redirect(new URL("/auth", request.url));
    }

    if (session && isPublicPath) {
        try {
            await decrypt(session);
            return NextResponse.redirect(new URL("/", request.url));
        } catch (e) {
            // Session invalid, continue to auth
        }
    }

    return NextResponse.next();
}

// Routes that should be handled by middleware
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        "/((?!api|_next/static|_next/image|favicon.ico).*)",
    ],
};
