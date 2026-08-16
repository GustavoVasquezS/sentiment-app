import { randomBytes, createHash } from "node:crypto";

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutos

export function generateResetToken(): { raw: string; hash: string; expiresAt: Date } {
  const raw = randomBytes(32).toString("hex");
  const hash = hashResetToken(raw);
  return { raw, hash, expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS) };
}

export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}
