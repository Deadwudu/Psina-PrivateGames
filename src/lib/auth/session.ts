import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./constants";
import { verifySessionToken } from "./jwt";

export type AppSession = {
  userId: string;
  username: string;
  isAdmin: boolean;
  /** UUID стороны; для администратора null */
  sideId: string | null;
};

export async function getSession(): Promise<AppSession | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = await verifySessionToken(token);
  const sub = payload?.sub;
  if (!sub || !payload?.username || typeof payload.isAdmin !== "boolean") return null;

  if (payload.isAdmin) {
    return { userId: sub, username: payload.username, isAdmin: true, sideId: null };
  }
  if (!payload.sideId) return null;
  return {
    userId: sub,
    username: payload.username,
    isAdmin: false,
    sideId: payload.sideId,
  };
}
