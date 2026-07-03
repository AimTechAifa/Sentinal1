import { cookies } from "next/headers";
import { parseSession } from "./cookie";
import { SESSION_COOKIE } from "./roles";

export { encodeSession, parseSession } from "./cookie";

export async function getSession() {
  const jar = await cookies();
  return parseSession(jar.get(SESSION_COOKIE)?.value);
}
