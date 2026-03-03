import { auth } from "@/lib/auth";

/**
 * Helper: get the authenticated user's ID or return null.
 */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user;
}
