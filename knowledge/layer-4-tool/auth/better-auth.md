# Better Auth

> **Lucia is deprecated.** The library was deprecated by its creator (pilcrow) in March 2025. The recommended successor is **Better Auth** (https://www.better-auth.com/). For lower-level utilities, pilcrow still maintains **Oslo** (auth/crypto primitives), **Arctic** (OAuth 2.0 client for 50+ providers), and **The Copenhagen Book** (educational auth patterns resource).

## Setup

```bash
npm install better-auth
```

```env
# .env
BETTER_AUTH_SECRET=<at-least-32-characters>   # openssl rand -base64 32
BETTER_AUTH_URL=http://localhost:3000          # your app's base URL
```

---

## Auth Instance Configuration

```typescript
// lib/auth.ts
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  database: /* adapter — see Database Adapters below */,

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
    },
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 days
    updateAge: 60 * 60 * 24,        // refresh daily
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60,               // 5-minute cookie cache
    },
  },

  user: {
    additionalFields: {
      role: {
        type: "string",
        input: false,                // prevent user-supplied values
      },
    },
  },
});
```

---

## Database Adapters

Better Auth supports raw database connections and ORM adapters. Run schema migrations via the CLI.

```bash
npx auth@latest migrate   # auto-detect and apply missing tables
npx auth@latest generate  # generate ORM-specific schema files
```

```typescript
// Prisma adapter
import { prismaAdapter } from "better-auth/adapters/prisma";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }), // or "mysql", "sqlite"
});

// Drizzle adapter
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }), // or "mysql", "sqlite"
});

// Raw connection (SQLite, PostgreSQL, MySQL)
import Database from "better-sqlite3";
export const auth = betterAuth({ database: new Database("./sqlite.db") });
```

### Core Schema

Better Auth requires four tables managed automatically by migrations:

| Table | Purpose |
| --- | --- |
| `user` | id, name, email, emailVerified, image, createdAt, updatedAt |
| `session` | id, token, userId, expiresAt, ipAddress, userAgent |
| `account` | OAuth tokens, refresh tokens, passwords, provider metadata |
| `verification` | Email verification and password reset tokens |

---

## Email & Password Authentication

```typescript
// Server — enable and configure
export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,   // default
    maxPasswordLength: 128, // default
    sendResetPassword: async ({ user, url }, request) => {
      await sendEmail({ to: user.email, subject: "Reset your password", text: `Click to reset: ${url}` });
    },
  },
});
```

```typescript
// Client — create auth client
import { createAuthClient } from "better-auth/react";
export const authClient = createAuthClient({ baseURL: "http://localhost:3000" });

// Sign up
const { data, error } = await authClient.signUp.email({
  name: "Jane Doe",
  email: "jane@example.com",
  password: "securepassword",
});

// Sign in
const { data, error } = await authClient.signIn.email({
  email: "jane@example.com",
  password: "securepassword",
  rememberMe: true,
});

// Sign out
await authClient.signOut();
```

### Custom Password Hashing (Argon2)

Better Auth uses scrypt by default. Override with Argon2 if needed:

```typescript
import { hash, verify } from "@node-rs/argon2";

export const auth = betterAuth({
  emailAndPassword: {
    enabled: true,
    password: {
      hash: (password) => hash(password, { memoryCost: 65536, timeCost: 3, parallelism: 4 }),
      verify: ({ password, hash: storedHash }) => verify(storedHash, password),
    },
  },
});
```

### Password Reset

```typescript
// Request reset
await authClient.requestPasswordReset({ email: "jane@example.com", redirectTo: "/reset-password" });

// Complete reset (from the emailed link)
const token = new URLSearchParams(window.location.search).get("token");
await authClient.resetPassword({ newPassword: "newsecurepassword", token });

// Change password while authenticated
await authClient.changePassword({
  currentPassword: "oldpassword",
  newPassword: "newpassword",
  revokeOtherSessions: true,
});
```

---

## Social / OAuth Providers

Add providers to `socialProviders` in the auth config. Each needs a `clientId` and `clientSecret`. Better Auth supports GitHub, Google, Discord, Apple, Facebook, Microsoft, and 40+ others.

Default callback URL: `/api/auth/callback/<providerName>`.

```typescript
// Client — initiate OAuth redirect
await authClient.signIn.social({ provider: "github" });

// Link an additional social account to existing user
await authClient.linkSocial({ provider: "google" });

// Retrieve provider access token (auto-refreshes if expired)
const { accessToken } = await authClient.getAccessToken({ providerId: "google" });
```

| Provider Option | Purpose |
| --- | --- |
| `scope` | Requested permissions (email, profile, etc.) |
| `redirectURI` | Custom callback URL |
| `disableSignUp` | Prevent new user registration via this provider |
| `overrideUserInfoOnSignIn` | Update user data on each sign-in |
| `mapProfileToUser` | Map provider profile to database user object |

---

## Magic Link (Plugin)

```typescript
// Server
import { magicLink } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }, ctx) => {
        await sendEmail({ to: email, subject: "Sign in", text: `Click to sign in: ${url}` });
      },
      expiresIn: 300,       // 5 minutes (default)
      disableSignUp: false, // allow new users (default)
    }),
  ],
});

// Client
import { magicLinkClient } from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [magicLinkClient()],
});

await authClient.signIn.magicLink({ email: "user@example.com", callbackURL: "/dashboard" });
await authClient.magicLink.verify({ query: { token: "abc123", callbackURL: "/dashboard" } });
```

---

## Session Management

```typescript
// Retrieve session
const { data: session } = await authClient.getSession();
const { data: session } = authClient.useSession();   // reactive hook (React)
const sessions = await authClient.listSessions();     // all active sessions

// Revoke sessions
await authClient.revokeSession({ token: "session-token" });
await authClient.revokeOtherSessions();
await authClient.revokeSessions();
```

### Session Configuration

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7,       // 7 days
  updateAge: 60 * 60 * 24,            // refresh daily
  freshAge: 60 * 5,                   // 5-minute freshness window
  cookieCache: {
    enabled: true,
    maxAge: 5 * 60,                   // 5-minute cache
    strategy: "compact",              // "compact" | "jwt" | "jwe"
  },
  deferSessionRefresh: true,          // GET is read-only; client POSTs to refresh
}
```

| Cookie Cache Strategy | Size | Security | Use Case |
| --- | --- | --- | --- |
| `compact` | Smallest | Signed | Performance-focused internal apps |
| `jwt` | Medium | Signed | Third-party integrations |
| `jwe` | Largest | Encrypted | Sensitive data, maximum security |

### Custom Session Data

```typescript
import { customSession } from "better-auth/plugins";

export const auth = betterAuth({
  plugins: [
    customSession(async ({ user, session }) => {
      const roles = await findUserRoles(session.session.userId);
      return { roles, user: { ...user, displayName: user.name.toUpperCase() }, session };
    }),
  ],
});
```

---

## Middleware Integration

### Next.js App Router

```typescript
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { POST, GET } = toNextJsHandler(auth);
```

```typescript
// Server Component — validate session
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function ProtectedPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  return <div>Hello, {session.user.name}</div>;
}
```

### Express

```typescript
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth";

const app = express();
// Mount Better Auth handler BEFORE express.json()
app.all("/api/auth/*", toNodeHandler(auth));
app.use(express.json());
app.listen(8000);
```

### Hono

```typescript
import { Hono } from "hono";
import { auth } from "./auth";

const app = new Hono();
app.on(["POST", "GET"], "/api/auth/*", (c) => auth.handler(c.req.raw));
```

### Cloudflare Workers

```typescript
export default {
  async fetch(request: Request) {
    if (new URL(request.url).pathname.startsWith("/api/auth")) return auth.handler(request);
    return new Response("Not found", { status: 404 });
  },
};
```

---

## TypeScript Type Safety

Better Auth requires `strict: true` (or at minimum `strictNullChecks: true`) in `tsconfig.json`.

### Type Inference with `$Infer`

```typescript
// Server-side
type Session = typeof auth.$Infer.Session;
// Session.user includes additionalFields; Session.session includes session metadata

// Client-side
type Session = typeof authClient.$Infer.Session;
```

### Inferring Additional Fields on the Client

```typescript
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// Same project — infer from server config
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});

// Separate project — declare fields manually
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields({ user: { role: { type: "string" } } })],
});
```

### Custom Session Types on the Client

```typescript
import { customSessionClient } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

const authClient = createAuthClient({
  plugins: [customSessionClient<typeof auth>()],
});

const { data } = authClient.useSession();
// data.roles, data.user.displayName — fully typed
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Importing from `lucia` in new projects | Lucia is deprecated and unmaintained | Use `better-auth` — covers sessions, OAuth, and password auth out of the box |
| Placing `express.json()` before the auth handler | Better Auth needs raw request bodies | Mount `app.all("/api/auth/*", toNodeHandler(auth))` before `express.json()` |
| Setting `input: true` on sensitive fields like `role` | Users can set their own role during signup | Use `input: false` for fields that should only be set server-side |
| Ignoring cookie cache expiry for revoked sessions | Revoked sessions stay active until cache expires | Keep `cookieCache.maxAge` short (< 5 min) or disable for high-security apps |
| Skipping `strictNullChecks` in tsconfig | Type inference breaks silently | Enable `strict: true` or at minimum `strictNullChecks: true` |
| Storing secrets in code instead of env vars | Credentials leak into version control | Use `BETTER_AUTH_SECRET` and provider env vars; never commit `.env` |
| Bypassing built-in OAuth state handling | CSRF vulnerability in OAuth flow | Better Auth manages state automatically — do not skip or override it |
| Leaving `disableSignUp: false` on all social providers | Uncontrolled user registration | Set `disableSignUp: true` on providers that should only link, not create accounts |
| Rolling your own session cookie logic | Duplicates built-in functionality, introduces bugs | Use `auth.api.getSession()` and built-in cookie management |
