import { clerkMiddleware } from "@clerk/nextjs/server";
import { shouldUseAuth } from "@/lib/shouldUseAuth";

function createMiddleware() {
  if (shouldUseAuth) {
    return clerkMiddleware();
  }
  return () => {};
}

export default createMiddleware();

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
