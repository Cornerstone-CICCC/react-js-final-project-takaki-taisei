import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 4000),
  corsOrigin: process.env.CORS_ORIGIN ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  jwtSecret: process.env.JWT_SECRET ?? "development-only-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ?? "",
  storageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "user-files",
  storageTimeoutMs: Number(process.env.STORAGE_TIMEOUT_MS ?? 30000),
};

export function validateEnvironment() {
  const database = new URL(process.env.DATABASE_URL ?? "file:missing");
  if (!["postgres:", "postgresql:"].includes(database.protocol)) throw new Error("DATABASE_URL must use PostgreSQL");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(database.hostname);
  if (!local && (database.searchParams.get("sslmode") !== "require" || database.searchParams.get("sslaccept") !== "strict")) {
    throw new Error("Remote PostgreSQL requires sslmode=require and sslaccept=strict");
  }
  if (env.jwtSecret.length < 32 || env.jwtSecret === "development-only-change-me") throw new Error("JWT_SECRET must contain at least 32 characters");
  if (env.corsOrigin.split(",").some((o) => !/^https?:\/\/[^/]+$/.test(o.trim()))) throw new Error("CORS_ORIGIN requires explicit origins");
  if (!env.supabaseSecretKey.startsWith("sb_secret_")) throw new Error("SUPABASE_SECRET_KEY must be a server secret key");
  const storageUrl = new URL(env.supabaseUrl);
  if (storageUrl.protocol !== "https:" && !(env.nodeEnv === "test" && storageUrl.hostname === "127.0.0.1")) throw new Error("Storage requires HTTPS");
  if (!Number.isFinite(env.storageTimeoutMs) || env.storageTimeoutMs < 1 || env.storageTimeoutMs > 30000) throw new Error("STORAGE_TIMEOUT_MS must be 1–30000");
}
