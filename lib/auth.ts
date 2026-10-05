import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { Role } from "../app/generated/prisma/client";

const secret = process.env.SESSION_SECRET;

if (!secret) {
  throw new Error("SESSION_SECRET is not defined");
}

const encodedKey = new TextEncoder().encode(secret);

export type SessionPayload = {
  userId: number;
  name: string;
  email: string;
  role: Role;
};

export async function createSession(payload: SessionPayload) {
  const expiresAt = new Date(Date.now() + 8 * 60 * 60 * 1000);

  const token = await new SignJWT({
    userId: payload.userId,
    name: payload.name,
    email: payload.email,
    role: payload.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(encodedKey);

  const cookieStore = await cookies();

  cookieStore.set("apparelflow_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("apparelflow_session")?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, encodedKey, {
      algorithms: ["HS256"],
    });

    return {
      userId: Number(payload.userId),
      name: String(payload.name),
      email: String(payload.email),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete("apparelflow_session");
}