/**
 * Test de integración de /producto contra una Postgres real (ver nota en
 * auth.test.ts sobre cómo levantar la base de test).
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { createAuthedUser, type TestSession } from "../helpers/testAuth.js";

const app = createApp();
const BASE = "/project/api/v2";

describe("producto (integration)", () => {
  let userA: TestSession;
  let userB: TestSession;
  let categoriaIdA: number;

  beforeAll(async () => {
    userA = await createAuthedUser(app);
    userB = await createAuthedUser(app);

    const categoriaRes = await request(app)
      .post(`${BASE}/categoria`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ nombreCategoria: "Categoría para productos de test" });
    categoriaIdA = categoriaRes.body.categoriaId;
  });

  afterAll(async () => {
    await prisma.usuario.deleteMany({ where: { correo: { in: [userA.correo, userB.correo] } } });
    await prisma.$disconnect();
  });

  it("crea un producto asociado a una categoría propia", async () => {
    const res = await request(app)
      .post(`${BASE}/producto`)
      .set("Authorization", `Bearer ${userA.token}`)
      .send({ nombreProducto: "Producto de Test", categoriaId: categoriaIdA });

    expect(res.status).toBe(201);
    expect(res.body.nombreProducto).toBe("Producto de Test");
    expect(res.body.categoriaId).toBe(categoriaIdA);
    expect(res.body.totalMenciones).toBe(0);
  });

  it("rechaza crear un producto sobre una categoría de otro usuario", async () => {
    const res = await request(app)
      .post(`${BASE}/producto`)
      .set("Authorization", `Bearer ${userB.token}`)
      .send({ nombreProducto: "Producto Intruso", categoriaId: categoriaIdA });

    expect(res.status).toBe(404);
  });

  it("lista productos por categoría", async () => {
    const res = await request(app)
      .get(`${BASE}/producto/por-categoria?categoriaId=${categoriaIdA}`)
      .set("Authorization", `Bearer ${userA.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.every((p: { categoriaId: number }) => p.categoriaId === categoriaIdA)).toBe(true);
  });

  it("obtiene un producto por id, pero no si pertenece a otro usuario", async () => {
    const listRes = await request(app).get(`${BASE}/producto?pageSize=1`).set("Authorization", `Bearer ${userA.token}`);
    const productoId = listRes.body.data[0].productoId;

    const ownRes = await request(app).get(`${BASE}/producto/${productoId}`).set("Authorization", `Bearer ${userA.token}`);
    expect(ownRes.status).toBe(200);

    const otherRes = await request(app).get(`${BASE}/producto/${productoId}`).set("Authorization", `Bearer ${userB.token}`);
    expect(otherRes.status).toBe(404);
  });
});
