import { NextRequest, NextResponse } from 'next/server';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { v4 as uuidv4 } from "uuid";

const isDevMode = process.env.NODE_ENV !== "production";

const uuidV4Regex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const protectedRoutes = !isDevMode ? ['/dashboard(.*)', '/post(.*)'] : [];
const isProtectedRoute = createRouteMatcher(protectedRoutes);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Protect routes
    if (isProtectedRoute(req)) {
        await auth.protect();
    }

    // Custom sid cookie logic
    const sid = req.cookies.get('sid')?.value;
    const response = NextResponse.next();

    if (!sid || !uuidV4Regex.test(sid)) {
        const newSid = uuidv4();
        response.cookies.set('sid', newSid, {
            httpOnly: true,
            secure: true,
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
            path: '/',
        });
    }
    return response;
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};