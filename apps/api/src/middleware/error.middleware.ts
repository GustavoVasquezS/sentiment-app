import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { AppError } from "../errors/AppError.js";
import { env } from "../config/env.js";

// Handler central de errores — reemplaza el GlobalExceptionHandler de
// Spring. Nunca expone stack traces al cliente en producción (mismo
// principio que server.error.include-stacktrace=never en el Java viejo).
export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      message: "Datos inválidos",
      errors: err.flatten().fieldErrors,
    });
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json({ message: err.message });
    return;
  }

  console.error(err);
  res.status(500).json({
    message: "Error interno del servidor",
    ...(env.NODE_ENV !== "production" && err instanceof Error ? { detail: err.message } : {}),
  });
}

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json({ message: `Ruta no encontrada: ${req.method} ${req.path}` });
}
