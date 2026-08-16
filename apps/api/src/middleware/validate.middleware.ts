import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny, z } from "zod";

interface ValidateSchemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

// Valida y reemplaza req.body/query/params con la versión parseada (con
// defaults/coerciones aplicadas). Los errores de ZodError los captura
// error.middleware.ts y los devuelve como 400.
export function validate(schemas: ValidateSchemas) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (schemas.body) req.body = schemas.body.parse(req.body);
    if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
    if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
    next();
  };
}

export type InferBody<S extends { body: ZodTypeAny }> = z.infer<S["body"]>;
