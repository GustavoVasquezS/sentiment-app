// Aumenta Request con el usuarioId inyectado por auth.middleware.ts,
// equivalente tipado del request.setAttribute("usuarioId", ...) que hacía
// el JwtAuthenticationFilter en el backend Java.
export {};

declare global {
  namespace Express {
    interface Request {
      usuarioId?: number;
    }
  }
}
