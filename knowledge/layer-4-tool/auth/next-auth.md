# NextAuth.js (Auth.js)

## Setup

```bash
npm install next-auth@beta
```

---

## Provider Configuration

```typescript
// auth.ts
import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub,
    Google,
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user || !user.passwordHash) return null;

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash,
        );
        if (!isValid) return null;

        return { id: user.id, name: user.name, email: user.email };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/auth/error",
  },
});
```

```typescript
// app/api/auth/[...nextauth]/route.ts
export { GET, POST } from "@/auth";
```

---

## JWT vs Database Sessions

```typescript
// JWT strategy (default, stateless)
export const { auth } = NextAuth({
  session: { strategy: "jwt" },
  // Tokens stored in encrypted cookie
  // No database needed for sessions
  // Good for: serverless, edge runtime
});

// Database strategy (server-side sessions)
export const { auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  // Sessions stored in database
  // Can revoke sessions server-side
  // Good for: security-sensitive apps
});
```

---

## Callbacks

```typescript
export const { handlers, auth } = NextAuth({
  providers: [Google, GitHub],
  callbacks: {
    // Control who can sign in
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        return profile?.email?.endsWith("@company.com") ?? false;
      }
      return true;
    },

    // Control redirect after sign in/out
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },

    // Customize JWT token contents
    async jwt({ token, user, account, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role ?? "user";
      }
      if (account) {
        token.accessToken = account.access_token;
      }
      // Handle client-side session update
      if (trigger === "update" && session) {
        token.name = session.name;
      }
      return token;
    },

    // Customize session object sent to client
    async session({ session, token }) {
      session.user.id = token.id as string;
      session.user.role = token.role as string;
      return session;
    },
  },
});
```

---

## Type Augmentation

```typescript
// types/next-auth.d.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { JWT as DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    accessToken?: string;
  }
}
```

---

## Middleware Protection

```typescript
// middleware.ts
import { auth } from "@/auth";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnAdmin = req.nextUrl.pathname.startsWith("/admin");
  const isOnApi = req.nextUrl.pathname.startsWith("/api");

  // Protect admin routes
  if (isOnAdmin && req.auth?.user?.role !== "admin") {
    return Response.redirect(new URL("/unauthorized", req.nextUrl));
  }

  // Protect dashboard
  if (isOnDashboard && !isLoggedIn) {
    const loginUrl = new URL("/login", req.nextUrl);
    loginUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return Response.redirect(loginUrl);
  }

  // Protect API routes
  if (isOnApi && !isLoggedIn) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|login|register).*)"],
};
```

---

## Role-Based Access Control

```typescript
// Server Component protection
import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  if (!session) redirect("/login");
  if (session.user.role !== "admin") redirect("/unauthorized");

  return <div>Admin content</div>;
}
```

```typescript
// Reusable authorization helper
export async function requireRole(role: string) {
  const session = await auth();
  if (!session) redirect("/login");
  if (session.user.role !== role) redirect("/unauthorized");
  return session;
}

// Usage in Server Component
export default async function AdminPage() {
  const session = await requireRole("admin");
  return <div>Welcome, {session.user.name}</div>;
}
```

---

## Adapter Pattern

Adapters connect Auth.js to your database for storing users, accounts, sessions, and verification tokens.

```typescript
import { PrismaAdapter } from "@auth/prisma-adapter";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

// Prisma Adapter
export const { auth } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [Google],
});

// Drizzle Adapter
export const { auth } = NextAuth({
  adapter: DrizzleAdapter(db),
  providers: [Google],
});
```

```prisma
// Required Prisma schema for Auth.js adapter
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("user")
  accounts      Account[]
  sessions      Session[]
}

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String?
  access_token      String?
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String?
  session_state     String?
  user              User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime
  @@unique([identifier, token])
}
```

---

## Server Actions

```typescript
// app/actions/auth.ts
"use server";

import { signIn, signOut } from "@/auth";

export async function loginAction(formData: FormData) {
  await signIn("credentials", {
    email: formData.get("email"),
    password: formData.get("password"),
    redirectTo: "/dashboard",
  });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function oauthAction(provider: string) {
  await signIn(provider, { redirectTo: "/dashboard" });
}
```

---

## Events

```typescript
export const { auth } = NextAuth({
  events: {
    async signIn({ user, account, isNewUser }) {
      if (isNewUser) {
        await sendWelcomeEmail(user.email!);
      }
      await logAuthEvent("sign_in", user.id!, account?.provider);
    },
    async signOut({ token }) {
      await logAuthEvent("sign_out", token.id as string);
    },
    async createUser({ user }) {
      await setupDefaultPreferences(user.id!);
    },
    async linkAccount({ user, account }) {
      await logAuthEvent("link_account", user.id!, account.provider);
    },
  },
});
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Using Credentials provider with database sessions | Credentials provider only supports JWT strategy | Set `session: { strategy: "jwt" }` when using Credentials |
| Storing sensitive data in JWT token | Token is readable client-side even if encrypted | Only store user ID and role; fetch sensitive data server-side |
| Not setting `pages.signIn` | Default sign-in page may not match your UI | Configure custom pages for consistent UX |
| Skipping type augmentation for extended session | TypeScript errors and missing autocomplete | Declare module augmentations for `Session`, `User`, and `JWT` |
| Using `auth()` in client components | `auth()` is server-only | Use `useSession()` from `next-auth/react` in client components |
| Not protecting API routes | API routes are public by default | Use middleware or check `auth()` in each route handler |
| Ignoring the `signIn` callback | Any user with an OAuth account can sign in | Restrict sign-in by email domain, allowlist, or database check |
| Not handling the `redirect` callback | Open redirect vulnerability | Validate redirect URLs against `baseUrl` |
