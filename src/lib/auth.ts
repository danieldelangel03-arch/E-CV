import "server-only";

import { createHmac, randomBytes, randomUUID } from "node:crypto";

import { and, eq, gt, isNull } from "drizzle-orm";
import { cookies, headers } from "next/headers";

import { getDb } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 14;

export type CurrentUser = {
  id: string;
  email: string;
  role: "admin" | "student";
  isActive: boolean;
};

export class AuthenticationError extends Error {
  constructor(message = "Debes iniciar sesión para continuar.") {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message);
    this.name = "AuthorizationError";
  }
}

function sessionCookieName() {
  return process.env.NODE_ENV === "production" ? "__Host-eprofile_session" : "eprofile_session";
}

function authSecret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET debe configurarse con al menos 32 caracteres.");
  }
  return value;
}

function hashSessionToken(token: string) {
  return createHmac("sha256", authSecret()).update(token).digest("hex");
}

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await getDb().insert(sessions).values({
    id: randomUUID(),
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
  });

  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName(), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
    priority: "high",
  });
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const token = (await cookies()).get(sessionCookieName())?.value;
  if (!token) return null;

  const [session] = await getDb()
    .select({
      id: sessions.id,
      userId: users.id,
      email: users.email,
      role: users.role,
      isActive: users.isActive,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(
      and(
        eq(sessions.tokenHash, hashSessionToken(token)),
        isNull(sessions.revokedAt),
        gt(sessions.expiresAt, new Date()),
        eq(users.isActive, true),
      ),
    )
    .limit(1);

  if (!session) return null;

  return {
    id: session.userId,
    email: session.email,
    role: session.role,
    isActive: session.isActive,
  };
}

export async function requireActiveUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) throw new AuthenticationError();
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await requireActiveUser();
  if (user.role !== "admin") throw new AuthorizationError();
  return user;
}

export async function revokeCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieName())?.value;

  if (token) {
    await getDb()
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(eq(sessions.tokenHash, hashSessionToken(token)));
  }

  cookieStore.delete(sessionCookieName());
}

export async function revokeAllUserSessions(userId: string) {
  await getDb()
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/**
 * Server Actions are public POST endpoints. This inexpensive check rejects
 * requests whose browser Origin does not match this deployment before state
 * changes are attempted. Requests without Origin are permitted for scripted
 * maintenance workflows; authorization is still required in every action.
 */
export async function assertSameOrigin() {
  const requestHeaders = await headers();
  const origin = requestHeaders.get("origin");
  if (!origin) return;

  const configuredOrigin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const forwardedHost = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const forwardedProtocol = requestHeaders.get("x-forwarded-proto") ?? "http";
  const expectedOrigin = configuredOrigin ?? (forwardedHost ? `${forwardedProtocol}://${forwardedHost}` : "");

  if (!expectedOrigin || new URL(origin).origin !== new URL(expectedOrigin).origin) {
    throw new AuthorizationError("Solicitud rechazada por origen no válido.");
  }
}
