import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// For development purposes, no route is protected. Please ensure to protect necessary routes before deploying to production.
// const isProtectedRoute = createRouteMatcher(['/dashboard(.*)', '/forum(.*)'])
const isProtectedRoute = createRouteMatcher([])

export default clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) await auth.protect()
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
