import { prisma } from "../lib/prisma.js";
import { sentimentService } from "./sentiment.service.js";
import { categoriaService } from "./categoria.service.js";
import { productoService } from "./producto.service.js";

interface CsvRow {
  categoria: string;
  producto: string;
  comentario: string;
}

interface Contador {
  total: number;
  positivos: number;
  negativos: number;
  neutrales: number;
}

function nuevoContador(): Contador {
  return { total: 0, positivos: 0, negativos: 0, neutrales: 0 };
}

// Puerto de CsvAnalysisServiceImplement.java: procesa un CSV subido como
// filas {categoria, producto, comentario} ya parseadas — auto-crea
// categorías/productos que no existan, analiza todos los comentarios en un
// único batch, y agrega estadísticas por producto y por categoría.
export const csvService = {
  async procesarYAnalizarCsv(rows: CsvRow[], usuarioId: number) {
    const categoriasMap = new Map<string, { id: number; nombre: string }>();
    const productosMap = new Map<string, { id: number; nombre: string; categoriaId: number }>();

    for (const row of rows) {
      const catKey = row.categoria.trim().toLowerCase();
      const prodKey = `${catKey}|${row.producto.trim().toLowerCase()}`;

      if (!categoriasMap.has(catKey)) {
        const cat = await categoriaService.findOrCreate(usuarioId, row.categoria.trim(), "Importado desde CSV");
        categoriasMap.set(catKey, cat);
      }

      if (!productosMap.has(prodKey)) {
        const cat = categoriasMap.get(catKey)!;
        const prod = await productoService.findOrCreate(usuarioId, row.producto.trim(), cat.id);
        productosMap.set(prodKey, prod);
      }
    }

    const resultados = await sentimentService.analizarTextos(rows.map((r) => r.comentario));

    let positivos = 0;
    let negativos = 0;
    let neutrales = 0;
    let sumaScores = 0;

    const contadoresProducto = new Map<string, Contador>();
    const contadoresCategoria = new Map<string, Contador>();

    rows.forEach((row, i) => {
      const resultado = resultados[i];
      sumaScores += resultado.probabilidad;
      if (resultado.prevision === "Positivo") positivos++;
      else if (resultado.prevision === "Negativo") negativos++;
      else neutrales++;

      const catKey = row.categoria.trim().toLowerCase();
      const prodKey = `${catKey}|${row.producto.trim().toLowerCase()}`;

      for (const [map, key] of [
        [contadoresProducto, prodKey],
        [contadoresCategoria, catKey],
      ] as const) {
        const c = map.get(key) ?? nuevoContador();
        c.total++;
        if (resultado.prevision === "Positivo") c.positivos++;
        else if (resultado.prevision === "Negativo") c.negativos++;
        else c.neutrales++;
        map.set(key, c);
      }
    });

    const total = rows.length;
    const avgScore = total > 0 ? sumaScores / total : 0;

    const sesion = await prisma.sesion.create({
      data: {
        usuarioId,
        avgScore,
        total,
        positivos,
        negativos,
        neutrales,
        comentarios: {
          create: rows.map((row, i) => ({
            texto: row.comentario,
            sentimiento: resultados[i].prevision,
            probabilidad: resultados[i].probabilidad,
          })),
        },
      },
    });

    for (const [prodKey, c] of contadoresProducto) {
      const prod = productosMap.get(prodKey)!;
      await productoService.actualizarContadores(prod.id, c.positivos, c.negativos, c.neutrales);
    }

    const productos = Array.from(productosMap.entries()).map(([prodKey, prod]) => {
      const c = contadoresProducto.get(prodKey)!;
      const catKey = prodKey.split("|")[0];
      return {
        productoId: prod.id,
        nombreProducto: prod.nombre,
        categoria: categoriasMap.get(catKey)!.nombre,
        totalComentarios: c.total,
        positivos: c.positivos,
        negativos: c.negativos,
        neutrales: c.neutrales,
        porcentajePositivo: c.total > 0 ? (c.positivos * 100) / c.total : 0,
      };
    });

    const categorias = Array.from(categoriasMap.entries()).map(([catKey, cat]) => {
      const c = contadoresCategoria.get(catKey)!;
      return {
        categoriaId: cat.id,
        nombreCategoria: cat.nombre,
        totalComentarios: c.total,
        positivos: c.positivos,
        negativos: c.negativos,
        neutrales: c.neutrales,
        porcentajePositivo: c.total > 0 ? (c.positivos * 100) / c.total : 0,
      };
    });

    return {
      sesionId: sesion.id,
      fecha: sesion.fecha.toISOString(),
      totalComentarios: total,
      totalPositivos: positivos,
      totalNegativos: negativos,
      totalNeutrales: neutrales,
      avgScore,
      categorias,
      productos,
      comentarios: rows.map((row, i) => ({
        texto: row.comentario,
        sentimiento: resultados[i].prevision,
        probabilidad: resultados[i].probabilidad,
      })),
    };
  },

  async obtenerComparativaProductos(usuarioId: number) {
    const productos = await prisma.producto.findMany({
      where: { usuarioId, totalMenciones: { gt: 0 } },
      include: { categoria: { select: { nombre: true } } },
    });

    return productos
      .map((p) => ({
        productoId: p.id,
        nombreProducto: p.nombre,
        categoria: p.categoria.nombre,
        totalComentarios: p.totalMenciones,
        positivos: p.positivos,
        negativos: p.negativos,
        neutrales: p.neutrales,
        porcentajePositivo: p.totalMenciones > 0 ? (p.positivos * 100) / p.totalMenciones : 0,
      }))
      .sort((a, b) => b.porcentajePositivo - a.porcentajePositivo);
  },

  async obtenerComparativaCategorias(usuarioId: number) {
    const categorias = await prisma.categoria.findMany({
      where: { usuarioId },
      include: { productos: true },
    });

    return categorias
      .map((cat) => {
        const total = cat.productos.reduce((sum, p) => sum + p.totalMenciones, 0);
        const positivos = cat.productos.reduce((sum, p) => sum + p.positivos, 0);
        const negativos = cat.productos.reduce((sum, p) => sum + p.negativos, 0);
        const neutrales = cat.productos.reduce((sum, p) => sum + p.neutrales, 0);
        return {
          categoriaId: cat.id,
          nombreCategoria: cat.nombre,
          totalComentarios: total,
          positivos,
          negativos,
          neutrales,
          porcentajePositivo: total > 0 ? (positivos * 100) / total : 0,
        };
      })
      .filter((c) => c.totalComentarios > 0)
      .sort((a, b) => b.porcentajePositivo - a.porcentajePositivo);
  },
};
