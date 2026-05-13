import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { UUID_RE } from "@/lib/uuid";

export type SessionPayload = JWTPayload & {
  username: string;
  /** Администратор мероприятия */
  isAdmin: boolean;
  /** UUID стороны из game_sides; у администратора всегда null */
  sideId: string | null;
};

function getSecretBytes(): Uint8Array | null {
  const raw = process.env.SESSION_SECRET?.trim();
  if (!raw || raw.length < 16) return null;
  return new TextEncoder().encode(raw);
}

export async function signSessionToken(user: {
  id: string;
  username: string;
  isAdmin: boolean;
  sideId: string | null;
}): Promise<string> {
  const secret = getSecretBytes();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET слишком короткий или не задан. Укажите случайную строку ≥16 символов в .env.local и на Vercel."
    );
  }
  return new SignJWT({
    username: user.username,
    isAdmin: user.isAdmin,
    sideId: user.sideId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  const secret = getSecretBytes();
  if (!secret) return null;
  try {
    const { payload } = await jwtVerify(token, secret, { algorithms: ["HS256"] });
    const username = payload.username;
    if (typeof username !== "string") return null;

    if (typeof payload.isAdmin === "boolean") {
      const sideRaw = payload.sideId;
      const sideId =
        sideRaw === null || sideRaw === undefined
          ? null
          : typeof sideRaw === "string" && UUID_RE.test(sideRaw)
            ? sideRaw
            : null;
      if (payload.isAdmin) {
        return { ...payload, username, isAdmin: true, sideId: null } as SessionPayload;
      }
      if (sideId) {
        return { ...payload, username, isAdmin: false, sideId } as SessionPayload;
      }
      return null;
    }

    return null;
  } catch {
    return null;
  }
}
