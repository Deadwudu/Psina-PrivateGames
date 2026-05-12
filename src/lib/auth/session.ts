import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";
import { verifySessionToken } from "./jwt";

export type AppSession = {
  userId: string;
  username: string;
  role: "side_a" | "side_b" | "admin";
};

export async function getSession(): Promise<AppSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  const sub = payload?.sub;
  if (!sub || !payload.username || !payload.role) return null;
  return { userId: sub, username: payload.username, role: payload.role };
}
