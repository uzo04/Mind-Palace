import express from "express";
import cors from "cors";
import helmet from "helmet";
import path from "node:path";
import { fileURLToPath } from "node:url";

import AuthRoutes from "./routes/AuthRoutes.js";
import SpaceRoutes from "./routes/SpaceRoutes.js";
import LocationRoutes from "./routes/LocationRoutes.js";
import ContentRoutes from "./routes/ContentRoutes.js";
import ProgressRoutes from "./routes/ProgressRoutes.js";
import StockImageRoutes from "./routes/StockImageRoutes.js";
import AdminRoutes from "./routes/AdminRoutes.js";
import SyncRoutes from "./routes/SyncRoutes.js";

import { errorHandler } from "./middleware/errorHandler.js";
import { globalLimiter } from "./middleware/rateLimiter.js";
import { notFound } from "./middleware/notFound.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, "../uploads");
const apiPrefixes = [
  "/auth",
  "/spaces",
  "/locations",
  "/content",
  "/progress",
  "/stock-images",
  "/admin",
  "/sync",
];
const configuredOrigins = (process.env.CORS_ORIGIN?.split(",") ?? ["http://localhost:5173"])
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = new Set(configuredOrigins);

app.set("trust proxy", 1);

for (const origin of configuredOrigins) {
  try {
    const url = new URL(origin);
    if (url.hostname === "localhost") {
      allowedOrigins.add(`${url.protocol}//127.0.0.1${url.port ? `:${url.port}` : ""}`);
    }
    if (url.hostname === "127.0.0.1") {
      allowedOrigins.add(`${url.protocol}//localhost${url.port ? `:${url.port}` : ""}`);
    }
  } catch {
  }
}

app.use(helmet({
  crossOriginResourcePolicy: false,
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "img-src": ["'self'", "data:", "blob:", "https:"],
    },
  },
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
const apiCors = (req, res, next) => cors({
  origin(origin, callback) {
    const requestOrigin = `${req.protocol}://${req.get("host")}`;

    if (!origin || allowedOrigins.has(origin) || origin === requestOrigin) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed by CORS: ${origin}`));
  },
  credentials: true,
})(req, res, next);

app.use(apiPrefixes, apiCors);

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "Mind Palace API" });
});

app.use([
  "/auth",
  "/spaces",
  "/locations",
  "/content",
  "/progress",
  "/stock-images",
  "/admin",
  "/sync",
], globalLimiter);
app.use("/uploads", express.static(uploadsDir, {
  fallthrough: false,
  immutable: true,
  maxAge: "7d",
  setHeaders: (res, filePath) => {
    res.setHeader("Cache-Control", "public, max-age=604800, immutable");
    if (filePath.endsWith(".svg")) {
      res.setHeader("Content-Disposition", "attachment");
    }
  },
}));

app.use("/auth", AuthRoutes);
app.use("/spaces", SpaceRoutes);
app.use("/locations", LocationRoutes);
app.use("/content", ContentRoutes);
app.use("/progress", ProgressRoutes);
app.use("/stock-images", StockImageRoutes);
app.use("/admin", AdminRoutes);
app.use("/sync", SyncRoutes);

const distPath = path.resolve(__dirname, "../../frontend/dist");
const distAssetsPath = path.join(distPath, "assets");
const nonSpaPrefixes = [
  ...apiPrefixes,
  "/uploads",
  "/health",
];

app.use("/assets", express.static(distAssetsPath, {
  fallthrough: false,
  immutable: true,
  maxAge: "365d",
  setHeaders: (res) => {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  },
}));

app.use(express.static(distPath, {
  index: false,
  fallthrough: true,
  setHeaders: (res, filePath) => {
    if (path.basename(filePath) === "index.html") {
      res.setHeader("Cache-Control", "no-store");
      return;
    }

    res.setHeader("Cache-Control", "public, max-age=3600");
  },
}));

app.get(/.*/, (req, res, next) => {
  const isApiRequest = nonSpaPrefixes.some((prefix) => req.path === prefix || req.path.startsWith(`${prefix}/`));
  const isAssetRequest = path.extname(req.path) !== "";

  if (isApiRequest || isAssetRequest) {
    next();
    return;
  }

  res.setHeader("Cache-Control", "no-store");
  res.sendFile(path.join(distPath, "index.html"));
});

app.use(notFound);
app.use(errorHandler);

export default app;
