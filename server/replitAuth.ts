import * as client from "openid-client";
import { Strategy, type VerifyFunction } from "openid-client/passport";

import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import MemStore from "memorystore";
import { storage } from "./storage";
import { nanoid } from "nanoid";

const isReplitEnvironment = !!process.env.REPL_ID;

// Use memory store for local dev
const memoryStore = new (MemStore(session))({ checkPeriod: 86400000 });

const getOidcConfig = memoize(
  async () => {
    if (!isReplitEnvironment) return null;
    return await client.discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  return session({
    secret: process.env.SESSION_SECRET || "dev-secret-key-change-in-production",
    store: memoryStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: sessionTtl,
    },
  });
}

function updateUserSession(user: any, tokens: any) {
  if (tokens.claims) {
    user.claims = tokens.claims();
    user.access_token = tokens.access_token;
    user.refresh_token = tokens.refresh_token;
    user.expires_at = user.claims?.exp;
  }
}

async function upsertUser(claims: any) {
  await storage.upsertUser({
    id: claims["sub"],
    email: claims["email"],
    firstName: claims["first_name"] || claims["given_name"] || "",
    lastName: claims["last_name"] || claims["family_name"] || "",
    profileImageUrl: claims["profile_image_url"],
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());
  app.use(passport.initialize());
  app.use(passport.session());

  if (!isReplitEnvironment) {
    // Local development mode - enable local signup/login endpoints (no Replit OIDC)
    console.log("🔧 Running in local development mode - using local auth endpoints");

    passport.serializeUser((user: Express.User, cb) => cb(null, user));
    passport.deserializeUser((user: Express.User, cb) => cb(null, user));

    // Convenience JSON endpoint for local/dev test automation: creates a mock user and returns JSON
    app.post("/api/mock-login", async (req, res) => {
      try {
        const body = req.body || {};
        const mockUser = {
          sub: body.id || "local-dev-user-" + Date.now(),
          email: body.email || "dev@example.com",
          first_name: body.first_name || "Dev",
          last_name: body.last_name || "User",
          profile_image_url: body.profile_image_url,
        };

        await upsertUser(mockUser);

        req.user = {
          claims: mockUser,
          access_token: "mock-token",
          refresh_token: "mock-refresh",
          expires_at: Math.floor(Date.now() / 1000) + 86400,
        } as any;

        req.login(req.user as Express.User, (err) => {
          if (err) return res.status(500).json({ message: "Login failed" });
          // return the created user for easier testing
          res.json({ user: req.user });
        });
      } catch (err) {
        console.error("mock-login error", err);
        res.status(500).json({ message: "mock login failed" });
      }
    });

    // Local signup endpoint (creates user with optional password)
    app.post('/api/signup', async (req, res) => {
      try {
        const { email, password, first_name, last_name, profile_image_url } = req.body || {};
        if (!email) return res.status(400).json({ message: 'Email required' });

        const id = nanoid();
        let passwordHash: string | undefined = undefined;
        if (password) {
          const crypto = await import('node:crypto');
          const salt = crypto.randomBytes(16).toString('hex');
          const derived = crypto.scryptSync(password, salt, 64);
          passwordHash = `${salt}:${derived.toString('hex')}`;
        }

        const userRecord = {
          id,
          email,
          passwordHash,
          firstName: first_name || '',
          lastName: last_name || '',
          profileImageUrl: profile_image_url || null,
        } as any;

        const created = await storage.upsertUser(userRecord);

        req.user = { claims: { sub: created.id, email: created.email, first_name: created.firstName, last_name: created.lastName }, expires_at: Math.floor(Date.now()/1000)+86400 } as any;
        req.login(req.user as Express.User, (err) => {
          if (err) return res.status(500).json({ message: 'Login failed' });
          res.json({ user: created });
        });
      } catch (err) {
        console.error('signup error', err);
        res.status(500).json({ message: 'Signup failed' });
      }
    });

    // Local login endpoint (email + password)
    app.post('/api/local-login', async (req, res) => {
      try {
        const { email, password } = req.body || {};
        if (!email || !password) return res.status(400).json({ message: 'Email and password required' });

        const user = await (storage as any).getUserByEmail(email);
        if (!user) return res.status(401).json({ message: 'Invalid credentials' });

        if (!user.passwordHash) return res.status(401).json({ message: 'No local password set for this account' });

        const crypto = await import('node:crypto');
        const [salt, storedHex] = (user.passwordHash as string).split(':');
        const derived = crypto.scryptSync(password, salt, 64);
        if (derived.toString('hex') !== storedHex) return res.status(401).json({ message: 'Invalid credentials' });

        req.user = { claims: { sub: user.id, email: user.email, first_name: user.firstName, last_name: user.lastName }, expires_at: Math.floor(Date.now()/1000)+86400 } as any;
        req.login(req.user as Express.User, (err) => {
          if (err) return res.status(500).json({ message: 'Login failed' });
          res.json({ user });
        });
      } catch (err) {
        console.error('local-login error', err);
        res.status(500).json({ message: 'Login failed' });
      }
    });

    app.get('/api/logout', (req, res) => {
      req.logout((err) => {
        if (err) return res.status(500).json({ message: 'Logout failed' });
        res.json({ ok: true });
      });
    });

    return;
  }

  // Replit production environment - use real OIDC
  const config = await getOidcConfig();
  if (config === null) throw new Error('OIDC configuration unavailable in Replit auth setup');

  const verify: VerifyFunction = async (
    tokens: client.TokenEndpointResponse & client.TokenEndpointResponseHelpers,
    verified: passport.AuthenticateCallback
  ) => {
    const user: any = {};
    updateUserSession(user, tokens);
    await upsertUser(tokens.claims());
    verified(null, user);
  };

  const registeredStrategies = new Set<string>();

  const ensureStrategy = (domain: string) => {
    const strategyName = `replitauth:${domain}`;
    if (!registeredStrategies.has(strategyName)) {
      const strategy = new Strategy(
        {
          name: strategyName,
          config,
          scope: "openid email profile offline_access",
          callbackURL: `https://${domain}/api/callback`,
        },
        verify,
      );
      passport.use(strategy);
      registeredStrategies.add(strategyName);
    }
  };

  passport.serializeUser((user: Express.User, cb) => cb(null, user));
  passport.deserializeUser((user: Express.User, cb) => cb(null, user));

  app.get("/api/login", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      prompt: "login consent",
      scope: ["openid", "email", "profile", "offline_access"],
    })(req, res, next);
  });

  app.get("/api/callback", (req, res, next) => {
    ensureStrategy(req.hostname);
    passport.authenticate(`replitauth:${req.hostname}`, {
      successReturnToOrRedirect: "/",
      failureRedirect: "/api/login",
    })(req, res, next);
  });

  app.get("/api/logout", (req, res) => {
    req.logout(() => {
      res.redirect(
        client.buildEndSessionUrl(config!, {
          client_id: process.env.REPL_ID!,
          post_logout_redirect_uri: `${req.protocol}://${req.hostname}`,
        }).href
      );
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.user as any;

  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!isReplitEnvironment) {
    // Local dev - skip token validation
    return next();
  }

  if (!user.expires_at) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const now = Math.floor(Date.now() / 1000);
  if (now <= user.expires_at) {
    return next();
  }

  const refreshToken = user.refresh_token;
  if (!refreshToken) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const config = await getOidcConfig();
    const tokenResponse = await client.refreshTokenGrant(config!, refreshToken);
    updateUserSession(user, tokenResponse);
    return next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
};
