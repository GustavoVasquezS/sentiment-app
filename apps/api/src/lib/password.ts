import bcrypt from "bcryptjs";

// bcrypt, misma familia de algoritmo que jbcrypt (Java) — hashes con
// prefijo $2a$/$2b$ son intercambiables entre ambas implementaciones.
const SALT_ROUNDS = 10;

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, SALT_ROUNDS);
}

export function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
