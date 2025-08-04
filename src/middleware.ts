import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|index|[^?]*\\.(?:html?|css|js(?!on)|...)).*)",
    "/(api|trpc)(.*)",
  ],
};
