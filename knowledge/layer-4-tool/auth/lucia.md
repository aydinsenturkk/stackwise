# Lucia

## Setup

```bash
npm install lucia
npm install @node-rs/argon2  # recommended password hashing
```

---

## Lucia Instance Configuration

```typescript
// auth.ts
import { Lucia } from "lucia";

export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    },
  },
  getUserAttributes: (attributes) => {
    return {
      email: attributes.email,
      name: attributes.name,
      role: attributes.role,
    };
  },
  getSessionAttributes: (attributes) => {
    return {
      ipAddress: attributes.ip_address,
      userAgent: attributes.user_agent,
    };
  },
});

// Type declarations for TypeScript
declare module "lucia" {
  interface Register {
    Lucia: typeof lucia;
    DatabaseUserAttributes: {
      email: string;
      name: string;
      role: string;
    };
    DatabaseSessionAttributes: {
      ip_address: string;
      user_agent: string;
    };
  }
}
```

---

## Database Adapters

Lucia v3 requires you to implement the adapter interface or use a community adapter.

```typescript
// Prisma adapter example
import { PrismaAdapter } from "@lucia-auth/adapter-prisma";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const adapter = new PrismaAdapter(prisma.session, prisma.user);

// Drizzle adapter example
import { DrizzlePostgreSQLAdapter } from "@lucia-auth/adapter-drizzle";
import { db } from "./db";
import { sessionTable, userTable } from "./schema";

const adapter = new DrizzlePostgreSQLAdapter(db, sessionTable, userTable);
```

```prisma
// Required Prisma schema
model User {
  id           String    @id
  email        String    @unique
  name         String
  role         String    @default("user")
  passwordHash String    @map("password_hash")
  sessions     Session[]
}

model Session {
  id        String   @id
  userId    String
  expiresAt DateTime
  ipAddress String?  @map("ip_address")
  userAgent String?  @map("user_agent")
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## Password Hashing

```typescript
import { hash, verify } from "@node-rs/argon2";

// Hash password on signup
const passwordHash = await hash(password, {
  memoryCost: 19456,
  timeCost: 2,
  outputLen: 32,
  parallelism: 1,
});

// Verify password on login
const isValid = await verify(storedHash, password);
```

---

## User Signup

```typescript
import { lucia } from "./auth";
import { generateIdFromEntropySize } from "lucia";
import { hash } from "@node-rs/argon2";

async function signup(email: string, password: string, name: string) {
  // Validate input
  if (!email || !password || password.length < 8) {
    throw new Error("Invalid input");
  }

  const passwordHash = await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });

  const userId = generateIdFromEntropySize(10); // 16 characters

  await db.user.create({
    data: {
      id: userId,
      email,
      name,
      passwordHash,
      role: "user",
    },
  });

  // Create session immediately after signup
  const session = await lucia.createSession(userId, {
    ip_address: request.ip,
    user_agent: request.headers.get("user-agent") ?? "",
  });

  const sessionCookie = lucia.createSessionCookie(session.id);
  return sessionCookie;
}
```

---

## User Login

```typescript
import { verify } from "@node-rs/argon2";

async function login(email: string, password: string, request: Request) {
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    // Use same error for both cases to prevent user enumeration
    throw new Error("Invalid credentials");
  }

  const isValid = await verify(user.passwordHash, password);
  if (!isValid) {
    throw new Error("Invalid credentials");
  }

  const session = await lucia.createSession(user.id, {
    ip_address: request.headers.get("x-forwarded-for") ?? "",
    user_agent: request.headers.get("user-agent") ?? "",
  });

  return lucia.createSessionCookie(session.id);
}
```

---

## Session Validation

```typescript
import type { Session, User } from "lucia";

async function validateSession(
  sessionId: string | null,
): Promise<{ user: User; session: Session } | { user: null; session: null }> {
  if (!sessionId) {
    return { user: null, session: null };
  }

  const result = await lucia.validateSession(sessionId);

  // Session is fresh — extend it by setting a new cookie
  if (result.session && result.session.fresh) {
    // Return new cookie to the client to extend session
  }

  // Session is invalid — clear the cookie
  if (!result.session) {
    // Return blank cookie to clear it
  }

  return result;
}
```

---

## Cookie Handling

```typescript
// Set session cookie after login
const sessionCookie = lucia.createSessionCookie(session.id);
response.headers.set("Set-Cookie", sessionCookie.serialize());

// Clear session cookie on logout
const blankCookie = lucia.createBlankSessionCookie();
response.headers.set("Set-Cookie", blankCookie.serialize());

// Read session cookie from request
const sessionId = lucia.readSessionCookie(request.headers.get("cookie") ?? "");
```

---

## Middleware (Express)

```typescript
import { lucia } from "./auth";
import type { Request, Response, NextFunction } from "express";
import type { Session, User } from "lucia";

// Extend Express types
declare global {
  namespace Express {
    interface Locals {
      user: User | null;
      session: Session | null;
    }
  }
}

async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const sessionId = lucia.readSessionCookie(req.headers.cookie ?? "");
  if (!sessionId) {
    res.locals.user = null;
    res.locals.session = null;
    return next();
  }

  const { session, user } = await lucia.validateSession(sessionId);

  if (session && session.fresh) {
    res.appendHeader(
      "Set-Cookie",
      lucia.createSessionCookie(session.id).serialize(),
    );
  }

  if (!session) {
    res.appendHeader(
      "Set-Cookie",
      lucia.createBlankSessionCookie().serialize(),
    );
  }

  res.locals.session = session;
  res.locals.user = user;
  next();
}

// Protection middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!res.locals.user) {
    return res.status(401).json({ error: "Authentication required" });
  }
  next();
}

app.use(authMiddleware);
app.get("/api/profile", requireAuth, (req, res) => {
  res.json(res.locals.user);
});
```

---

## Middleware (Next.js App Router)

```typescript
// lib/auth.ts
import { cookies } from "next/headers";
import { cache } from "react";
import type { Session, User } from "lucia";

export const validateRequest = cache(
  async (): Promise<
    { user: User; session: Session } | { user: null; session: null }
  > => {
    const sessionId =
      cookies().get(lucia.sessionCookieName)?.value ?? null;

    if (!sessionId) {
      return { user: null, session: null };
    }

    const result = await lucia.validateSession(sessionId);

    try {
      if (result.session && result.session.fresh) {
        const sessionCookie = lucia.createSessionCookie(result.session.id);
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
      if (!result.session) {
        const sessionCookie = lucia.createBlankSessionCookie();
        cookies().set(
          sessionCookie.name,
          sessionCookie.value,
          sessionCookie.attributes,
        );
      }
    } catch {
      // Next.js throws when setting cookies during page render
    }

    return result;
  },
);
```

```typescript
// Server Component usage
import { validateRequest } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const { user } = await validateRequest();
  if (!user) redirect("/login");

  return <div>Hello, {user.name}</div>;
}
```

---

## OAuth Integration

```typescript
import { generateState, generateCodeVerifier } from "arctic";
import { github } from "./oauth-providers";

// Step 1: Redirect to OAuth provider
async function initiateOAuth() {
  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = github.createAuthorizationURL(state, codeVerifier, ["user:email"]);

  // Store state and verifier in cookie for validation
  cookies().set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  return url;
}

// Step 2: Handle OAuth callback
async function handleOAuthCallback(code: string, state: string) {
  const storedState = cookies().get("oauth_state")?.value;
  if (!state || state !== storedState) {
    throw new Error("Invalid state");
  }

  const tokens = await github.validateAuthorizationCode(code);
  const githubUser = await fetchGitHubUser(tokens.accessToken());

  // Find or create user
  let user = await db.user.findFirst({
    where: { githubId: githubUser.id },
  });

  if (!user) {
    user = await db.user.create({
      data: {
        id: generateIdFromEntropySize(10),
        githubId: githubUser.id,
        email: githubUser.email,
        name: githubUser.name,
        role: "user",
      },
    });
  }

  const session = await lucia.createSession(user.id, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  cookies().set(
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );
}
```

---

## Logout and Session Invalidation

```typescript
// Logout current session
async function logout() {
  const { session } = await validateRequest();
  if (!session) return;

  await lucia.invalidateSession(session.id);

  const blankCookie = lucia.createBlankSessionCookie();
  cookies().set(
    blankCookie.name,
    blankCookie.value,
    blankCookie.attributes,
  );
}

// Invalidate all sessions for a user (password change, account compromise)
async function invalidateAllSessions(userId: string) {
  await lucia.invalidateUserSessions(userId);
}
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using `bcrypt` instead of Argon2 | Argon2 is more resistant to GPU attacks | Use `@node-rs/argon2` with recommended parameters |
| Not refreshing fresh sessions | Sessions expire unnecessarily | Check `session.fresh` and set a new cookie when true |
| Skipping blank cookie on invalid session | Stale session cookie persists in browser | Always set blank cookie when `session` is null |
| Storing passwords in plain text | Critical security vulnerability | Always hash with Argon2 before storing |
| Using sequential IDs for users | Predictable, enumerable user identifiers | Use `generateIdFromEntropySize()` for random IDs |
| Not validating OAuth state parameter | CSRF vulnerability in OAuth flow | Generate, store, and verify state on callback |
| Sharing session across subdomains without intent | Unintended session access from other subdomains | Configure cookie domain explicitly |
| Catching errors silently in validateRequest | Masks database connection issues | Log errors; only catch cookie-setting errors in Next.js |
