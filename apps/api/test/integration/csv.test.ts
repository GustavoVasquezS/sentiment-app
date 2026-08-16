/**
 * Test de integración de /csv contra una Postgres real (ver nota en
 * auth.test.ts). Cliente ML mockeado, ver sesion.test.ts.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { createAuthedUser, type TestSession } from "../helpers/testAuth.js";
import { mockMlClient, restoreMlClient } from "../helpers/mockMlClient.js";

const app = createApp();
const BASE = "/project/api/v2";

describe("csv (integration)", () => {
  let user: TestSession;

  beforeAll(async () => {
    mockMlClient();
    user = await createAuthedUser(app);
  });

  afterAll(async () => {
    restoreMlClient();
    await prisma.usuario.deleteMany({ where: { correo: user.correo } });
    await prisma.$disconnect();
  });

  it("procesa un CSV, auto-crea categoría/producto y agrega estadísticas por producto y categoría", async () => {
    const res = await request(app)
      .post(`${BASE}/csv/analizar`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        rows: [
          { categoria: "Electrónica CSV", producto: "Laptop CSV", comentario: "Excelente laptop, muy conforme" },
          { categoria: "Electrónica CSV", producto: "Laptop CSV", comentario: "Terrible, llegó malo" },
          { categoria: "Electrónica CSV", producto: "Mouse CSV", comentario: "Bueno, cumple lo esperado" },
        ],
      });

    expect(res.status).toBe(200);
    expect(res.body.totalComentarios).toBe(3);
    expect(res.body.totalPositivos).toBe(2);
    expect(res.body.totalNegativos).toBe(1);

    const laptop = res.body.productos.find((p: { nombreProducto: string }) => p.nombreProducto === "Laptop CSV");
    expect(laptop.totalComentarios).toBe(2);
    expect(laptop.positivos).toBe(1);
    expect(laptop.negativos).toBe(1);

    const categoria = res.body.categorias.find((c: { nombreCategoria: string }) => c.nombreCategoria === "Electrónica CSV");
    expect(categoria.totalComentarios).toBe(3);
  });

  it("comparativa-productos devuelve los productos con menciones, ordenados por % positivo descendente", async () => {
    const res = await request(app).get(`${BASE}/csv/comparativa-productos`).set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(2);
    for (let i = 1; i < res.body.length; i++) {
      expect(res.body[i - 1].porcentajePositivo).toBeGreaterThanOrEqual(res.body[i].porcentajePositivo);
    }
  });

  it("comparativa-categorias agrega los productos de cada categoría", async () => {
    const res = await request(app).get(`${BASE}/csv/comparativa-categorias`).set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    const categoria = res.body.find((c: { nombreCategoria: string }) => c.nombreCategoria === "Electrónica CSV");
    expect(categoria).toBeTruthy();
    expect(categoria.totalComentarios).toBe(3);
  });

  it("rechaza /csv/analizar sin filas con 400", async () => {
    const res = await request(app).post(`${BASE}/csv/analizar`).set("Authorization", `Bearer ${user.token}`).send({ rows: [] });

    expect(res.status).toBe(400);
  });
});
