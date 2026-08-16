export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso no encontrado") {
    super(404, message);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "No autorizado - Token inválido o faltante") {
    super(401, message);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, message);
  }
}

export class ValidationFailedError extends AppError {
  constructor(message = "Datos inválidos") {
    super(400, message);
  }
}

// Se lanza cuando el microservicio ML (services/ml) no responde, responde
// con error, o se cae el timeout — se mapea a 502 en error.middleware.ts,
// nunca se expone el detalle interno al cliente.
export class UpstreamMLError extends AppError {
  constructor(message = "Servicio de análisis de sentimiento no disponible") {
    super(502, message);
  }
}
