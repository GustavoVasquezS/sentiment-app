/**
 * Test de integración de /categoria contra una Postgres real (ver nota en
 * auth.test.ts sobre cómo levantar la base de test).
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { createAuthedUser, type TestSession } from "../helpers/testAuth.js";

const app = createApp();
const BASE = "/project/api/v2";

describe("categoria (integration)", () => {
  let userA: TestSession;
  let userB: TestSession;

  beforeAll(async () => {
    userA = await createAuthedUser(app);
    userB = await createAuthedUser(app);
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { correo: { in: [userA.correo, userB.correo] } } });
    await prisma.$disconnect();
  });

  it("ya trae las categorías default sembradas al registrarse", async () => {
    const res = await request(app).get(`${BASE}/categoria`).set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.total).toBeGreaterThanOrEqual(12);
    expect(res.body.page).toBe(1);
  });

  it("crea una categoría nueva y aparece en el listado", async () => {
    const createRes = await request(app)
      .post(`${BASE}/categoria`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ nombreCategoria: "Electrodomésticos de Test", descripcion: "creada por el test de integración" });

    expect(createRes.status).toBe(201);
    expect(createRes.body.nombreCategoria).toBe("Electrodomésticos de Test");

    const listRes = await request(app).get(`${BASE}/categoria?pageSize=100`).set("Authorization", `Bearer ${userA.token}`);
    const nombres = listRes.body.data.map((c: { nombreCategoria: string }) => c.nombreCategoria);
    expect(nombres).toContain("Electrodomésticos de Test");
  });

  it("respeta pageSize en la paginación", async () => {
    const res = await request(app).get(`${BASE}/categoria?page=1&pageSize=5`).set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(5);
    expect(res.body.pageSize).toBe(5);
    expect(res.body.totalPages).toBeGreaterThanOrEqual(Math.ceil(res.body.total / 5));
  });

  it("devuelve 404 al pedir una categoría que pertenece a otro usuario", async () => {
    const ownRes = await request(app).get(`${BASE}/categoria?pageSize=1`).set("Authorization", `Bearer ${userA.token}`);
    const categoriaIdDeUserA = ownRes.body.data[0].categoriaId;

    const res = await request(app).get(`${BASE}/categoria/${categoriaIdDeUserA}`).set("Authorization", `Bearer ${userB.token}`);

    expect(res.status).toBe(404);
  });

  it("devuelve 400 si falta el nombre de la categoría", async () => {
    const res = await request(app).post(`${BASE}/categoria`).set("Authorization", `Bearer ${userA.token}`).send({ descripcion: "sin nombre" });

    expect(res.status).toBe(400);
  });
});
