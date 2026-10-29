import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router, type IRouter, type RequestHandler } from "express";
import {
  GetCurrentUserResponse,
  LoginUserBody,
  LoginUserResponse,
  LogoutUserResponse,
  RegisterUserBody,
  RegisterUserResponse,
} from "@workspace/api-zod";
import { db, usersTable } from "@workspace/db";
import {
  createSession,
  getSessionUser,
  requireAuth,
  requireSameOrigin,
  revokeSession,
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "../lib/auth";

const router: IRouter = Router();
const DUMMY_PASSWORD_HASH = bcrypt.hashSync(
  "projetech-login-timing-placeholder",
  12,
);
const rateLimitBuckets = new Map<string, { count: number; resetAt: number }>();

function hasDatabaseErrorCode(error: unknown, code: string): boolean {
  let current: unknown = error;
  for (let depth = 0; depth < 4 && current instanceof Error; depth += 1) {
    if ((current as Error & { code?: string }).code === code) return true;
    current = current.cause;
  }
  return false;
}

const authRateLimit: RequestHandler = (req, res, next) => {
  const now = Date.now();
  const key = req.ip || "unknown";
  let bucket = rateLimitBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + 15 * 60 * 1000 };
    rateLimitBuckets.set(key, bucket);
  }
  if (bucket.count >= 30) {
    res.setHeader("Retry-After", Math.ceil((bucket.resetAt - now) / 1000));
    res.status(429).json({ error: "Muitas tentativas. Aguarde alguns minutos." });
    return;
  }
  bucket.count += 1;
  if (rateLimitBuckets.size > 2000) {
    for (const [address, entry] of rateLimitBuckets) {
      if (entry.resetAt <= now) rateLimitBuckets.delete(address);
    }
  }
  next();
};

router.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

router.post("/auth/register", authRateLimit, requireSameOrigin, async (req, res): Promise<void> => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const name = parsed.data.name.trim();
  const email = parsed.data.email.trim().toLowerCase();
  if (name.length < 2 || Buffer.byteLength(parsed.data.password, "utf8") > 72) {
    res.status(400).json({ error: "Confira o nome e a senha informados." });
    return;
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  try {
    const [user] = await db
      .insert(usersTable)
      .values({ name, email, passwordHash, role: "USER" })
      .returning({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
        updatedAt: usersTable.updatedAt,
      });

    await revokeSession(req.cookies?.[SESSION_COOKIE_NAME] as string | undefined);
    const token = await createSession(user.id);
    res.cookie(SESSION_COOKIE_NAME, token, {
      ...sessionCookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json(RegisterUserResponse.parse(user));
  } catch (error) {
    if (hasDatabaseErrorCode(error, "23505")) {
      res.status(409).json({ error: "Já existe uma conta com este e-mail." });
      return;
    }
    throw error;
  }
});

router.post("/auth/login", authRateLimit, requireSameOrigin, async (req, res): Promise<void> => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const email = parsed.data.email.trim().toLowerCase();
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  const passwordMatches = await bcrypt.compare(
    parsed.data.password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );
  if (
    !user ||
    !passwordMatches ||
    Buffer.byteLength(parsed.data.password, "utf8") > 72
  ) {
    res.status(401).json({ error: "E-mail ou senha inválidos." });
    return;
  }

  const publicUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
  await revokeSession(req.cookies?.[SESSION_COOKIE_NAME] as string | undefined);
  const token = await createSession(user.id);
  res.cookie(SESSION_COOKIE_NAME, token, {
    ...sessionCookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  res.json(LoginUserResponse.parse(publicUser));
});

router.post("/auth/logout", requireSameOrigin, async (req, res): Promise<void> => {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  await revokeSession(token);
  res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions);
  res.json(LogoutUserResponse.parse({ message: "Sessão encerrada." }));
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  const user = await getSessionUser(token);
  if (!user) {
    res.status(401).json({ error: "Faça login para continuar." });
    return;
  }
  res.json(GetCurrentUserResponse.parse(user));
});

export default router;
