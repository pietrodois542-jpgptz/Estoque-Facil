import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { RequestHandler } from "express";
import { db, authSessionsTable, usersTable } from "@workspace/db";

export const SESSION_COOKIE_NAME = "projetech_session";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export const sessionCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "strict" as const,
  path: "/api",
};

export type PublicUser = Pick<
  typeof usersTable.$inferSelect,
  "id" | "name" | "email" | "role" | "createdAt" | "updatedAt"
>;

function hashSessionToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId: number): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await db.insert(authSessionsTable).values({
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS),
  });
  return token;
}

export async function getSessionUser(
  token: string | undefined,
): Promise<PublicUser | null> {
  if (!token || token.length > 128) return null;

  const [user] = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      email: usersTable.email,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
      updatedAt: usersTable.updatedAt,
    })
    .from(authSessionsTable)
    .innerJoin(usersTable, eq(authSessionsTable.userId, usersTable.id))
    .where(
      and(
        eq(authSessionsTable.tokenHash, hashSessionToken(token)),
        gt(authSessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  return user ?? null;
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token || token.length > 128) return;
  await db
    .delete(authSessionsTable)
    .where(eq(authSessionsTable.tokenHash, hashSessionToken(token)));
}

export const requireSameOrigin: RequestHandler = (req, res, next) => {
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    next();
    return;
  }

  const origin = req.get("origin");
  const host = req.get("host");

  if (!origin || !host) {
    res.status(403).json({ error: "Origem da solicitação não permitida." });
    return;
  }

  try {
    const originHost = new URL(origin).host;
    if (originHost.toLowerCase() !== host.toLowerCase()) {
      res.status(403).json({ error: "Origem da solicitação não permitida." });
      return;
    }
  } catch {
    res.status(403).json({ error: "Origem da solicitação não permitida." });
    return;
  }

  next();
};

export const requireAuth: RequestHandler = async (req, res, next) => {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  const user = await getSessionUser(token);

  if (!user) {
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
    res.status(401).json({ error: "Faça login para continuar." });
    return;
  }

  res.locals.authUser = user;
  next();
};
