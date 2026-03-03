export { auth as proxy } from "@/lib/auth";

export const config = {
  // Protect dashboard and board routes — let auth, api, and static files through
  matcher: ["/dashboard/:path*", "/board/:path*"],
};
