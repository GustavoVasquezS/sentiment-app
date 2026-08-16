import request from "supertest";
import type { Express } from "express";

// Registra y loguea un usuario descartable para tests de integración.
// El cleanup del usuario (y todo lo que le pertenece: categorías,
// productos, sesiones) se hace en un solo delete gracias a onDelete:
// Cascade en el schema de Prisma — ver testAuth.cleanup().
export interface TestSession {
  token: string;
  correo: string;
}

export async function createAuthedUser(app: Express): Promise<TestSession> {
  const correo = `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const contrasena = "password123";

  const registerRes = await request(app).post("/project/api/v2/usuario").send({
    nombre: "Test",
    apellido: "User",
    correo,
    contrasena,
  });
  if (registerRes.status !== 201) {
    throw new Error(`No se pudo registrar el usuario de test: ${registerRes.status} ${JSON.stringify(registerRes.body)}`);
  }

  const loginRes = await request(app).post("/project/api/v2/usuario/login").send({ correo, contrasena });
  if (loginRes.status !== 200) {
    throw new Error(`No se pudo loguear el usuario de test: ${loginRes.status} ${JSON.stringify(loginRes.body)}`);
  }

  return { token: loginRes.body.token as string, correo };
}
