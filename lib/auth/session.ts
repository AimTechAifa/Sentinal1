import { auth, currentUser } from "@clerk/nextjs/server";
import type { SessionUser } from "./roles";

export { encodeSession, parseSession } from "./cookie";

export async function getSession(): Promise<SessionUser | null> {
  let userId: string | null | undefined;
  try {
    ({ userId } = await auth());
  } catch {
    return null;
  }
  if (!userId) return null;

  let email = "";
  let name = "User";

  try {
    const clerkUser = await currentUser();
    if (clerkUser) {
      email =
        clerkUser.primaryEmailAddress?.emailAddress ??
        clerkUser.emailAddresses[0]?.emailAddress ??
        "";
      name =
        clerkUser.fullName?.trim() ||
        [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
        (email ? email.split("@")[0] : "") ||
        "User";
    }
  } catch {
    // Clerk API unreachable (network blip) — keep session valid for polling routes
  }

  return {
    id: userId,
    email,
    name,
    role: "admin",
  };
}
