/**
 * Test de integración de /sesion contra una Postgres real (ver nota en
 * auth.test.ts). El cliente ML se mockea (test/helpers/mockMlClient.ts) con
 * una clasificación determinística por palabras clave, para no depender del
 * microservicio Python real ni de la precisión del modelo — lo que se
 * verifica acá es la orquestación (conteos, contadores de producto,
 * detección de menciones por substring, paginación del historial), no la
 * calidad del análisis de sentimiento en sí.
 */
import { describe, expect, it, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { createApp } from "../../src/app.js";
import { prisma } from "../../src/lib/prisma.js";
import { createAuthedUser, type TestSession } from "../helpers/testAuth.js";
import { mockMlClient, restoreMlClient } from "../helpers/mockMlClient.js";

const app = createApp();
const BASE = "/project/api/v2";

describe("sesion (integration)", () => {
  let user: TestSession;
  let categoriaId: number;
  let productoSuperTvId: number;
  let productoMiniTvId: number;

  beforeAll(async () => {
    mockMlClient();
    user = await createAuthedUser(app);

    const categoriaRes = await request(app)
      .post(`${BASE}/categoria`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ nombreCategoria: "TVs de Test" });
    categoriaId = categoriaRes.body.categoriaId;

    const productoRes = await request(app)
      .post(`${BASE}/producto`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ nombreProducto: "SuperTV", categoriaId });
    productoSuperTvId = productoRes.body.productoId;

    const producto2Res = await request(app)
      .post(`${BASE}/producto`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ nombreProducto: "MiniTV", categoriaId });
    productoMiniTvId = producto2Res.body.productoId;
  });

  afterAll(async () => {
    restoreMlClient();
    await prisma.usuario.deleteMany({ where: { correo: user.correo } });
    await prisma.$disconnect();
  });

  it("analizar calcula estadísticas agregadas y guarda los comentarios", async () => {
    const res = await request(app)
      .post(`${BASE}/sesion/analizar`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ comentarios: ["Es un producto excelente", "Esto es muy malo", "normal, nada especial"] });

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.positivos).toBe(1);
    expect(res.body.negativos).toBe(1);
    expect(res.body.neutrales).toBe(1);
    expect(res.body.comentarios).toHaveLength(3);
    expect(res.body.sessionId).toBeTruthy();
  });

  it("analizar-con-producto detecta menciones por nombre y actualiza los contadores del producto", async () => {
    const res = await request(app)
      .post(`${BASE}/sesion/analizar-con-producto`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ comentarios: ["El SuperTV es excelente", "Este comentario no menciona nada"], productoId: productoSuperTvId });

    expect(res.status).toBe(200);
    expect(res.body.productoMenciones.totalMencionesEnSesion).toBe(1);
    expect(res.body.productoMenciones.positivosEnSesion).toBe(1);

    const productoRes = await request(app).get(`${BASE}/producto/${productoSuperTvId}`).set("Authorization", `Bearer ${user.token}`);
    expect(productoRes.body.totalMenciones).toBe(1);
    expect(productoRes.body.positivos).toBe(1);
  });

  it("ultima-sesion-productos refleja la sesión con producto más reciente", async () => {
    const res = await request(app).get(`${BASE}/sesion/ultima-sesion-productos`).set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.productos).toBeTruthy();
    expect(res.body.productos.some((p: { nombreProducto: string }) => p.nombreProducto === "SuperTV")).toBe(true);
  });

  it("analizar-con-lista-productos detecta múltiples productos en el mismo lote", async () => {
    const res = await request(app)
      .post(`${BASE}/sesion/analizar-con-lista-productos`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({
        comentarios: ["El SuperTV es excelente", "El MiniTV es malo", "comentario sin producto"],
        productosIds: [productoSuperTvId, productoMiniTvId],
      });

    expect(res.status).toBe(200);
    const nombres = res.body.productosDetectados.map((p: { nombreProducto: string }) => p.nombreProducto);
    expect(nombres).toContain("SuperTV");
    expect(nombres).toContain("MiniTV");
  });

  it("analizar-csv-batch auto-crea categoría y producto cuando no existen", async () => {
    const res = await request(app)
      .post(`${BASE}/sesion/analizar-csv-batch`)
      .set("Authorization", `Bearer ${user.token}`)
      .send({ entradas: [{ texto: "Buen servicio, muy conforme", producto: "Producto Auto-CSV", categoria: "Categoría Auto-CSV" }] });

    expect(res.status).toBe(200);
    expect(res.body.productosDetectados.some((p: { nombreProducto: string }) => p.nombreProducto === "Producto Auto-CSV")).toBe(true);

    const categoriasRes = await request(app).get(`${BASE}/categoria?pageSize=100`).set("Authorization", `Bearer ${user.token}`);
    const nombres = categoriasRes.body.data.map((c: { nombreCategoria: string }) => c.nombreCategoria);
    expect(nombres).toContain("Categoría Auto-CSV");
  });

  it("rechaza analizar-csv-batch sin entradas con 400", async () => {
    const res = await request(app).post(`${BASE}/sesion/analizar-csv-batch`).set("Authorization", `Bearer ${user.token}`).send({ entradas: [] });

    expect(res.status).toBe(400);
  });

  it("historial devuelve las sesiones del usuario paginadas, más recientes primero", async () => {
    const res = await request(app).get(`${BASE}/sesion/historial?page=1&pageSize=3`).set("Authorization", `Bearer ${user.token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeLessThanOrEqual(3);
    expect(res.body.total).toBeGreaterThanOrEqual(5);
    expect(res.body.pageSize).toBe(3);
  });
});
