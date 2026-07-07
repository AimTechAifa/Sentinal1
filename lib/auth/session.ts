import { auth, currentUser } from "@clerk/nextjs/server";
import type { SessionUser } from "./roles";

export { encodeSession, parseSession } from "./cookie";

export async function getSession(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const clerkUser = await currentUser();
  const email =
    clerkUser?.primaryEmailAddress?.emailAddress ??
    clerkUser?.emailAddresses[0]?.emailAddress ??
    "";

  const name =
    clerkUser?.fullName?.trim() ||
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ").trim() ||
    (email ? email.split("@")[0] : "") ||
    "User";

  return {
    id: userId,
    email,
    name,
    role: "admin",
  };
}
