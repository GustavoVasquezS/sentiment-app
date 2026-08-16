/**
 * Test de integración end-to-end del flujo de auth contra una Postgres real.
 *
 * Requiere DATABASE_URL apuntando a una base de datos de test con las
 * migraciones aplicadas (`prisma migrate deploy`) — por ejemplo, levantar
 * `docker compose up postgres` y correr las migraciones contra
 * `sentiment_test` antes de `npm test`. Se deja como ejemplo de la
 * estructura que deberían seguir los tests de integración del resto de
 * controllers (categoria, producto, sesion, csv), no como suite exhaustiva.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";

const app = createApp();

const testUser = {
  nombre: "Test",
  apellido: "User",
  correo: `test-${Date.now()}@example.com`,
  contrasena: "password123",
};

describe("auth flow (integration)", () => {
  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { correo: testUser.correo } });
    await prisma.$disconnect();
  });

  it("registers, then logs in and returns a JWT", async () => {
    const registerRes = await request(app).post("/project/api/v2/usuario").send(testUser);
    expect(registerRes.status).toBe(201);

    const loginRes = await request(app)
      .post("/project/api/v2/usuario/login")
      .send({ correo: testUser.correo, contrasena: testUser.contrasena });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeTruthy();
    expect(loginRes.body.correo).toBe(testUser.correo);
  });

  it("rejects a wrong password with 401", async () => {
    const res = await request(app)
      .post("/project/api/v2/usuario/login")
      .send({ correo: testUser.correo, contrasena: "wrong-password" });

    expect(res.status).toBe(401);
  });

  it("rejects protected routes without a token", async () => {
    const res = await request(app).get("/project/api/v2/categoria");
    expect(res.status).toBe(401);
  });
});
