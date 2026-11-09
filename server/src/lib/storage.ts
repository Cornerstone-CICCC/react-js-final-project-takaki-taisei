import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { env } from "../config/env";
import { AppError } from "../utils/AppError";

export function objectPrefix(ownerId: string, nodeId: string) {
  const safe = /^[a-zA-Z0-9_-]{1,128}$/;
  if (!safe.test(ownerId) || !safe.test(nodeId)) throw new AppError(500, "Invalid object identity");
  return `${ownerId}/${nodeId}/`;
}

export function assertStorageKey(key: string, ownerId: string, nodeId: string) {
  const prefix = objectPrefix(ownerId, nodeId);
  if (!key.startsWith(prefix) || !/^[a-zA-Z0-9_-]{1,128}$/.test(key.slice(prefix.length))) {
    throw new AppError(500, "Invalid storage reference");
  }
}

export function checksum(bytes: Buffer) {
  return createHash("sha256").update(bytes).digest("hex");
}

function client() {
  if (!env.supabaseUrl || !env.supabaseSecretKey) throw new AppError(503, "Storage is not configured");
  return createClient(env.supabaseUrl, env.supabaseSecretKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (url, init) => fetch(url, { ...init, signal: AbortSignal.timeout(env.storageTimeoutMs) }) },
  });
}

export const storage = {
  async assertPrivate() {
    const { data, error } = await client().storage.getBucket(env.storageBucket);
    if (error || !data || data.public !== false) throw new AppError(503, "Private storage bucket unavailable");
  },
  async upload(key: string, bytes: Buffer, mimeType: string) {
    const { error } = await client().storage.from(env.storageBucket).upload(key, bytes, {
      contentType: mimeType, upsert: false,
    });
    if (error) throw new AppError(503, "Storage upload failed; please retry");
  },
  async download(key: string) {
    const { data, error } = await client().storage.from(env.storageBucket).download(key);
    if (error || !data) throw new AppError(503, "Stored file unavailable; please retry");
    return Buffer.from(await data.arrayBuffer());
  },
  async remove(key: string) {
    const { error } = await client().storage.from(env.storageBucket).remove([key]);
    if (error) throw new AppError(503, "Storage cleanup failed");
  },
};
