import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../lib/jwt.js";
import { UnauthorizedError } from "../errors/AppError.js";

// A diferencia del filtro Java original (un solo Filter aplicado a "/*"),
// este middleware se monta explícitamente solo en los routers que
// requieren auth — más claro sobre qué endpoints son públicos.
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("authorization") ?? req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null;

  if (!token) {
    throw new UnauthorizedError();
  }

  try {
    const payload = verifyToken(token);
    req.usuarioId = payload.usuarioId;
    next();
  } catch {
    throw new UnauthorizedError();
  }
}
