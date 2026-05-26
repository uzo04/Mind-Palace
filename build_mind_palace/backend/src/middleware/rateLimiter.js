import jwt from "jsonwebtoken";

import { ApiError } from "../utils/ApiError.js";

const stores = new Map();

function getStore(name) {
  if (!stores.has(name)) {
    stores.set(name, new Map());
  }

  return stores.get(name);
}

function cleanupExpired(store, now) {
  for (const [key, entry] of store.entries()) {
    if (entry.resetAt <= now) {
      store.delete(key);
    }
  }
}

function getVerifiedUserId(req) {
  const authHeader = String(req.headers.authorization || "");
  if (!authHeader.startsWith("Bearer ") || !process.env.JWT_SECRET) {
    return null;
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return null;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded?.id ? String(decoded.id) : null;
  } catch {
    return null;
  }
}

function defaultKeyGenerator(req) {
  return String(
    req.user?.id ||
    getVerifiedUserId(req) ||
    req.ip ||
    req.headers["x-forwarded-for"] ||
    "anonymous"
  );
}

function createLimiter({
  name,
  windowMs,
  max,
  message,
  keyGenerator = defaultKeyGenerator,
}) {
  const store = getStore(name);

  return (req, res, next) => {
    const now = Date.now();
    cleanupExpired(store, now);

    const key = keyGenerator(req);
    const entry = store.get(key);

    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }

    entry.count += 1;
    if (entry.count <= max) {
      return next();
    }

    const retryAfterSeconds = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    res.setHeader("Retry-After", String(retryAfterSeconds));
    return next(new ApiError(429, message));
  };
}

export const globalLimiter = createLimiter({
  name: "global",
  windowMs: 60 * 1000,
  max: 240,
  message: "Твърде много заявки за кратко време. Опитайте отново след малко.",
});

export const authLimiter = createLimiter({
  name: "auth",
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: "Има твърде много опити за вход. Изчакайте малко и опитайте отново.",
  keyGenerator: (req) => String(req.ip || req.headers["x-forwarded-for"] || "anonymous"),
});

export const uploadLimiter = createLimiter({
  name: "upload",
  windowMs: 5 * 60 * 1000,
  max: 30,
  message: "Достигнат е лимитът за качване на изображения. Опитайте отново след малко.",
});
