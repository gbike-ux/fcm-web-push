import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default withAuth(
    function middleware(request: NextRequest) {
        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token
        },
        pages: {
            signIn: '/auth/signin',
            error: '/auth/error'
        }
    }
);

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api/notification (FCM 알림 API)
         * - api/automation (자동화 API)
         * - auth (NextAuth)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api/notification|api/automation|auth|_next/static|_next/image|favicon.ico).*)',
    ],
}; 