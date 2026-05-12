import { SignJWT, jwtVerify, type JWTPayload } from "jose";

export type SessionPayload = JWTPayload & {
  username: string;
  role: "side_a" | "side_b" | "admin";
};

function getSecretBytes(): Uint8Array | null {
  const raw = process.env.SESSION_SECRET?.trim();
  if (!raw || raw.length < 16) return null;
  return new TextEncoder().encode(raw);
}

export async function signSessionToken(user: {
  id: string;
  username: string;
  role: "side_a" | "side_b" | "admin";
}): Promise<string> {
  const secret = getSecretBytes();
  if (!secret) {
    throw new Error(
      "SESSION_SECRET слишком короткий или не задан. Укажите случайную строку ≥16 символов в .env.local и на Vercel."
    );
  }
  return new SignJWT({ username: user.username, role: user.role })
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
    const role = payload.role;
    if (typeof username !== "string" || (role !== "side_a" && role !== "side_b" && role !== "admin")) {
      return null;
    }
    return { ...payload, username, role } as SessionPayload;
  } catch {
    return null;
  }
}
