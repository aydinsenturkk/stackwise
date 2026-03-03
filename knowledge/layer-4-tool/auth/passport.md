# Passport.js

## Setup

```bash
npm install passport passport-local passport-jwt passport-oauth2 express-session
npm install -D @types/passport @types/passport-local @types/passport-jwt @types/passport-oauth2 @types/express-session
```

---

## Strategy Pattern

Passport uses a strategy pattern where each authentication method is a separate module. Strategies are configured with `passport.use()` and invoked with `passport.authenticate()`.

```typescript
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import bcrypt from "bcrypt";

// Local Strategy (username/password)
passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
      passReqToCallback: false,
    },
    async (email, password, done) => {
      try {
        const user = await UserRepository.findByEmail(email);
        if (!user) {
          return done(null, false, { message: "Invalid credentials" });
        }
        const isValid = await bcrypt.compare(password, user.passwordHash);
        if (!isValid) {
          return done(null, false, { message: "Invalid credentials" });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);

// JWT Strategy (token-based)
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      issuer: "your-app",
      audience: "your-app",
    },
    async (payload: { sub: string; email: string; role: string }, done) => {
      try {
        const user = await UserRepository.findById(payload.sub);
        if (!user) {
          return done(null, false);
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);
```

---

## OAuth2 Strategy

```typescript
import { Strategy as OAuth2Strategy } from "passport-oauth2";

passport.use(
  "google",
  new OAuth2Strategy(
    {
      authorizationURL: "https://accounts.google.com/o/oauth2/v2/auth",
      tokenURL: "https://oauth2.googleapis.com/token",
      clientID: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      callbackURL: "http://localhost:3000/auth/google/callback",
      scope: ["profile", "email"],
      state: true, // CSRF protection
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await UserRepository.findByProviderId("google", profile.id);
        if (!user) {
          user = await UserRepository.create({
            providerId: profile.id,
            provider: "google",
            email: profile.emails?.[0]?.value,
            name: profile.displayName,
          });
        }
        return done(null, user);
      } catch (err) {
        return done(err);
      }
    },
  ),
);
```

---

## Custom Strategy

```typescript
import { Strategy as OAuth2Strategy } from "passport-oauth2";
import util from "util";

function GitHubStrategy(
  options: { clientID: string; clientSecret: string; callbackURL: string },
  verify: Function,
) {
  const opts = {
    ...options,
    authorizationURL: "https://github.com/login/oauth/authorize",
    tokenURL: "https://github.com/login/oauth/access_token",
    scope: ["user:email"],
  };
  OAuth2Strategy.call(this, opts, verify);
  this.name = "github";
  this._userProfileURL = "https://api.github.com/user";
}

util.inherits(GitHubStrategy, OAuth2Strategy);

GitHubStrategy.prototype.userProfile = function (
  accessToken: string,
  done: Function,
) {
  this._oauth2.get(this._userProfileURL, accessToken, (err: any, body: string) => {
    if (err) {
      return done(new Error("Failed to fetch user profile"));
    }
    try {
      const json = JSON.parse(body);
      const profile = {
        provider: "github",
        id: String(json.id),
        displayName: json.name,
        username: json.login,
        emails: [{ value: json.email }],
      };
      done(null, profile);
    } catch (e) {
      done(e);
    }
  });
};
```

---

## Serialize / Deserialize

Session-based authentication requires telling Passport how to store and retrieve the user from the session.

```typescript
// Store minimal data in session (just the user ID)
passport.serializeUser((user: Express.User, done) => {
  done(null, (user as any).id);
});

// Retrieve full user from database on each request
passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await UserRepository.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});
```

---

## Session Handling with Express

```typescript
import express from "express";
import session from "express-session";
import passport from "passport";
import RedisStore from "connect-redis";
import { createClient } from "redis";

const app = express();
const redisClient = createClient({ url: process.env.REDIS_URL });
await redisClient.connect();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Session configuration
app.use(
  session({
    store: new RedisStore({ client: redisClient }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: "lax",
    },
  }),
);

// Initialize passport AFTER session middleware
app.use(passport.initialize());
app.use(passport.session());
```

---

## Middleware Integration

```typescript
// Login route
app.post("/auth/login", passport.authenticate("local"), (req, res) => {
  res.json({ user: req.user });
});

// Login with redirect
app.post(
  "/auth/login",
  passport.authenticate("local", {
    successRedirect: "/dashboard",
    failureRedirect: "/login",
    failureMessage: true,
  }),
);

// OAuth routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: "/login" }),
  (req, res) => {
    res.redirect("/dashboard");
  },
);

// JWT-protected route (no session)
app.get(
  "/api/profile",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json(req.user);
  },
);

// Logout
app.post("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy((err) => {
      if (err) return next(err);
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
});
```

---

## Route Protection Middleware

```typescript
// Ensure user is authenticated
function ensureAuthenticated(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction,
) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: "Authentication required" });
}

// Role-based authorization
function requireRole(...roles: string[]) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Authentication required" });
    }
    const user = req.user as { role: string };
    if (!roles.includes(user.role)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
}

// Usage
app.get("/api/admin", ensureAuthenticated, requireRole("ADMIN"), (req, res) => {
  res.json({ message: "Admin data" });
});
```

---

## TypeScript Type Augmentation

```typescript
// types/express.d.ts
declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: string;
      name: string;
    }
  }
}

export {};
```

---

## Anti-Patterns

| Anti-Pattern | Problem | Instead |
| --- | --- | --- |
| Storing full user object in session | Bloats session, stale data | Serialize only the user ID, deserialize on each request |
| Not using `passReqToCallback` when needed | Cannot access request context in strategy | Enable when you need IP, headers, or tenant info |
| Skipping `state: true` in OAuth2 | Vulnerable to CSRF attacks | Always enable state parameter for OAuth flows |
| Using `session: true` with JWT strategy | Defeats the purpose of stateless tokens | Set `session: false` for JWT-authenticated routes |
| Returning specific "user not found" vs "wrong password" | Leaks user enumeration info | Return generic "Invalid credentials" for both cases |
| Initializing passport before session middleware | Sessions will not work | Always call `passport.initialize()` after `app.use(session(...))` |
| Not destroying session on logout | Session fixation vulnerability | Call `req.session.destroy()` and clear the cookie |
| Hardcoded secrets in strategy config | Leaked credentials in source control | Use environment variables for all secrets |
