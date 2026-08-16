import { prisma } from "../lib/prisma.js";
import { sentimentService } from "./sentiment.service.js";
import { productoService } from "./producto.service.js";
import { categoriaService } from "./categoria.service.js";
import { NotFoundError, ValidationFailedError } from "../errors/AppError.js";
import type { PredictResponse, Sentimiento } from "../clients/ml.client.js";
import type { Prisma } from "@prisma/client";
import { buildPaginatedResult, toPrismaSkipTake, type PaginationParams } from "../lib/pagination.js";

interface Stats {
  total: number;
  positivos: number;
  negativos: number;
  neutrales: number;
  avgScore: number;
}

function computeStats(resultados: PredictResponse[]): Stats {
  let positivos = 0;
  let negativos = 0;
  let neutrales = 0;
  let sumaScores = 0;

  for (const r of resultados) {
    sumaScores += r.probabilidad;
    if (r.prevision === "Positivo") positivos++;
    else if (r.prevision === "Negativo") negativos++;
    else neutrales++;
  }

  const total = resultados.length;
  return { total, positivos, negativos, neutrales, avgScore: total > 0 ? sumaScores / total : 0 };
}

// Puerto de ContadorProducto (clase auxiliar en SesionServiceImplement.java).
class ContadorProducto {
  total = 0;
  positivos = 0;
  negativos = 0;
  neutrales = 0;

  incrementar(sentimiento: Sentimiento) {
    this.total++;
    if (sentimiento === "Positivo") this.positivos++;
    else if (sentimiento === "Negativo") this.negativos++;
    else this.neutrales++;
  }
}

export const sesionService = {
  // Puerto de guardarSesion(SesionDto, usuarioId): guarda una sesión ya
  // calculada del lado del cliente (sin volver a llamar al servicio ML).
  async guardarSesion(
    usuarioId: number,
    data: { avgScore: number; total: number; positivos: number; negativos: number; neutrales: number }
  ) {
    await prisma.sesion.create({ data: { ...data, usuarioId } });
  },

  async obtenerSesionesPorUsuario(usuarioId: number, pagination: PaginationParams) {
    const where = { usuarioId };
    const [sesiones, total] = await Promise.all([
      prisma.sesion.findMany({
        where,
        ...toPrismaSkipTake(pagination),
        orderBy: { id: "desc" },
        include: {
          comentarios: true,
          sesionProductos: { include: { producto: true } },
        },
      }),
      prisma.sesion.count({ where }),
    ]);

    const data = sesiones.map((sesion) => {
      const productoIdToName = new Map(sesion.sesionProductos.map((sp) => [sp.productoId, sp.producto.nombre]));

      const comentarios = sesion.comentarios.map((c) => {
        const textoLower = c.texto.toLowerCase();
        let productoAsociado: string | null = null;
        for (const nombre of productoIdToName.values()) {
          if (textoLower.includes(nombre.toLowerCase())) {
            productoAsociado = nombre;
            break;
          }
        }
        return { texto: c.texto, sentimiento: c.sentimiento, probabilidad: c.probabilidad, productoAsociado };
      });

      const totalSesion = sesion.total || 1;
      const productosDetectados = sesion.sesionProductos.map((sp) => ({
        nombreProducto: sp.producto.nombre,
        totalMencionesEnSesion: sp.mencionesSesion,
        positivosEnSesion: sp.positivosSesion,
        negativosEnSesion: sp.negativosSesion,
        neutralesEnSesion: sp.neutralesSesion,
        porcentajeMenciones: (sp.mencionesSesion / totalSesion) * 100,
      }));

      return {
        sessionId: sesion.id,
        date: sesion.fecha.toISOString(),
        avgScore: sesion.avgScore,
        total: sesion.total,
        positivos: sesion.positivos,
        negativos: sesion.negativos,
        neutrales: sesion.neutrales,
        comentarios,
        productosDetectados: productosDetectados.length > 0 ? productosDetectados : undefined,
      };
    });

    return buildPaginatedResult(data, total, pagination);
  },

  async analizarYGuardarComentarios(comentarios: string[], usuarioId: number) {
    const resultados = await sentimentService.analizarTextos(comentarios);
    const stats = computeStats(resultados);

    const sesion = await prisma.sesion.create({
      data: {
        usuarioId,
        avgScore: stats.avgScore,
        total: stats.total,
        positivos: stats.positivos,
        negativos: stats.negativos,
        neutrales: stats.neutrales,
        comentarios: {
          create: comentarios.map((texto, i) => ({
            texto,
            sentimiento: resultados[i].prevision,
            probabilidad: resultados[i].probabilidad,
          })),
        },
      },
    });

    return {
      sessionId: sesion.id,
      date: sesion.fecha.toISOString(),
      ...stats,
      comentarios: comentarios.map((texto, i) => ({
        texto,
        sentimiento: resultados[i].prevision,
        probabilidad: resultados[i].probabilidad,
      })),
    };
  },

  async analizarYGuardarConProducto(comentarios: string[], usuarioId: number, productoId: number) {
    const producto = await prisma.producto.findFirst({ where: { id: productoId, usuarioId } });
    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }

    const resultados = await sentimentService.analizarTextos(comentarios);
    const stats = computeStats(resultados);

    const nombreLower = producto.nombre.toLowerCase();
    const contador = new ContadorProducto();
    comentarios.forEach((texto, i) => {
      if (texto.toLowerCase().includes(nombreLower)) {
        contador.incrementar(resultados[i].prevision);
      }
    });

    const sesion = await prisma.$transaction(async (tx) => {
      const nuevaSesion = await tx.sesion.create({
        data: {
          usuarioId,
          productoId,
          avgScore: stats.avgScore,
          total: stats.total,
          positivos: stats.positivos,
          negativos: stats.negativos,
          neutrales: stats.neutrales,
          comentarios: {
            create: comentarios.map((texto, i) => ({
              texto,
              sentimiento: resultados[i].prevision,
              probabilidad: resultados[i].probabilidad,
            })),
          },
        },
      });

      if (contador.total > 0) {
        await tx.sesionProducto.create({
          data: {
            sesionId: nuevaSesion.id,
            productoId,
            mencionesSesion: contador.total,
            positivosSesion: contador.positivos,
            negativosSesion: contador.negativos,
            neutralesSesion: contador.neutrales,
          },
        });
      }

      return nuevaSesion;
    });

    if (contador.total > 0) {
      await productoService.actualizarContadores(productoId, contador.positivos, contador.negativos, contador.neutrales);
    }

    return {
      sessionId: sesion.id,
      date: sesion.fecha.toISOString(),
      ...stats,
      productoId,
      nombreProducto: producto.nombre,
      productoMenciones: {
        nombreProducto: producto.nombre,
        totalMencionesEnSesion: contador.total,
        positivosEnSesion: contador.positivos,
        negativosEnSesion: contador.negativos,
        neutralesEnSesion: contador.neutrales,
        porcentajeMenciones: stats.total > 0 ? (contador.total * 100) / stats.total : 0,
      },
      comentarios: comentarios.map((texto, i) => ({
        texto,
        sentimiento: resultados[i].prevision,
        probabilidad: resultados[i].probabilidad,
      })),
    };
  },

  async obtenerProductosUltimaSesion(usuarioId: number) {
    const ultimaSesion = await prisma.sesion.findFirst({
      where: { usuarioId },
      orderBy: { id: "desc" },
      include: { sesionProductos: { include: { producto: { include: { categoria: true } } } } },
    });

    if (!ultimaSesion || ultimaSesion.sesionProductos.length === 0) {
      return null;
    }

    return {
      sesionId: ultimaSesion.id,
      fecha: ultimaSesion.fecha.toISOString(),
      totalProductosAnalizados: ultimaSesion.sesionProductos.length,
      productos: ultimaSesion.sesionProductos.map((sp) => ({
        productoId: sp.productoId,
        nombreProducto: sp.producto.nombre,
        nombreCategoria: sp.producto.categoria.nombre,
        mencionesEnUltimaSesion: sp.mencionesSesion,
        positivosEnUltimaSesion: sp.positivosSesion,
        negativosEnUltimaSesion: sp.negativosSesion,
      })),
    };
  },

  async analizarConMismosProductos(comentarios: string[], usuarioId: number, sesionPreviaId: number) {
    const sesionPrevia = await prisma.sesion.findFirst({
      where: { id: sesionPreviaId, usuarioId },
      include: { sesionProductos: true },
    });
    if (!sesionPrevia) {
      throw new NotFoundError("Sesión previa no encontrada");
    }
    if (sesionPrevia.sesionProductos.length === 0) {
      throw new ValidationFailedError("La sesión no tiene productos asociados");
    }

    const productosIds = sesionPrevia.sesionProductos.map((sp) => sp.productoId);
    return this.analizarConMultiplesProductos(comentarios, usuarioId, productosIds);
  },

  async analizarConMultiplesProductos(comentarios: string[], usuarioId: number, productosIds: number[]) {
    const productos = await prisma.producto.findMany({ where: { id: { in: productosIds }, usuarioId } });
    if (productos.length !== productosIds.length) {
      throw new NotFoundError("Uno o más productos no fueron encontrados");
    }

    const resultados = await sentimentService.analizarTextos(comentarios);
    const stats = computeStats(resultados);

    const contadores = new Map(productos.map((p) => [p.id, new ContadorProducto()]));
    comentarios.forEach((texto, i) => {
      const textoLower = texto.toLowerCase();
      for (const producto of productos) {
        if (textoLower.includes(producto.nombre.toLowerCase())) {
          contadores.get(producto.id)!.incrementar(resultados[i].prevision);
        }
      }
    });

    const sesion = await prisma.$transaction(async (tx) => {
      const nuevaSesion = await tx.sesion.create({
        data: {
          usuarioId,
          avgScore: stats.avgScore,
          total: stats.total,
          positivos: stats.positivos,
          negativos: stats.negativos,
          neutrales: stats.neutrales,
          comentarios: {
            create: comentarios.map((texto, i) => ({
              texto,
              sentimiento: resultados[i].prevision,
              probabilidad: resultados[i].probabilidad,
            })),
          },
        },
      });

      for (const producto of productos) {
        const contador = contadores.get(producto.id)!;
        if (contador.total > 0) {
          await tx.sesionProducto.create({
            data: {
              sesionId: nuevaSesion.id,
              productoId: producto.id,
              mencionesSesion: contador.total,
              positivosSesion: contador.positivos,
              negativosSesion: contador.negativos,
              neutralesSesion: contador.neutrales,
            },
          });
        }
      }

      return nuevaSesion;
    });

    const productosDetectados = [];
    for (const producto of productos) {
      const contador = contadores.get(producto.id)!;
      if (contador.total > 0) {
        await productoService.actualizarContadores(producto.id, contador.positivos, contador.negativos, contador.neutrales);
        productosDetectados.push({
          nombreProducto: producto.nombre,
          totalMencionesEnSesion: contador.total,
          positivosEnSesion: contador.positivos,
          negativosEnSesion: contador.negativos,
          neutralesEnSesion: contador.neutrales,
          porcentajeMenciones: stats.total > 0 ? (contador.total * 100) / stats.total : 0,
        });
      }
    }

    return {
      sessionId: sesion.id,
      date: sesion.fecha.toISOString(),
      ...stats,
      productosDetectados,
      comentarios: comentarios.map((texto, i) => ({
        texto,
        sentimiento: resultados[i].prevision,
        probabilidad: resultados[i].probabilidad,
      })),
    };
  },

  async analizarBatchConCsv(entradas: { texto: string; producto?: string; categoria?: string }[], usuarioId: number) {
    const categoriasMap = new Map<string, Prisma.CategoriaGetPayload<object>>();
    const productosMap = new Map<string, Prisma.ProductoGetPayload<object>>();

    for (const entrada of entradas) {
      const catNombre = entrada.categoria?.trim();
      if (catNombre && !categoriasMap.has(catNombre)) {
        categoriasMap.set(catNombre, await categoriaService.findOrCreate(usuarioId, catNombre));
      }

      const prodNombre = entrada.producto?.trim();
      if (prodNombre && !productosMap.has(prodNombre)) {
        let categoria = catNombre ? categoriasMap.get(catNombre) : undefined;
        if (!categoria) {
          categoria = await categoriaService.findOrCreate(usuarioId, "General", "Categoría por defecto");
          categoriasMap.set("General", categoria);
        }
        productosMap.set(prodNombre, await productoService.findOrCreate(usuarioId, prodNombre, categoria.id));
      }
    }

    const entradasValidas = entradas.filter((e) => e.texto?.trim());
    if (entradasValidas.length === 0) {
      throw new ValidationFailedError("No hay textos válidos para analizar");
    }

    const resultados = await sentimentService.analizarTextos(entradasValidas.map((e) => e.texto));
    const stats = computeStats(resultados);

    const contadores = new Map<number, ContadorProducto>();
    for (const producto of productosMap.values()) {
      contadores.set(producto.id, new ContadorProducto());
    }

    entradasValidas.forEach((entrada, i) => {
      const prodNombre = entrada.producto?.trim();
      if (prodNombre) {
        const producto = productosMap.get(prodNombre);
        if (producto) contadores.get(producto.id)!.incrementar(resultados[i].prevision);
      }
    });

    const sesion = await prisma.$transaction(async (tx) => {
      const nuevaSesion = await tx.sesion.create({
        data: {
          usuarioId,
          avgScore: stats.avgScore,
          total: stats.total,
          positivos: stats.positivos,
          negativos: stats.negativos,
          neutrales: stats.neutrales,
          comentarios: {
            create: entradasValidas.map((entrada, i) => ({
              texto: entrada.texto.trim(),
              sentimiento: resultados[i].prevision,
              probabilidad: resultados[i].probabilidad,
            })),
          },
        },
      });

      for (const producto of productosMap.values()) {
        const contador = contadores.get(producto.id)!;
        if (contador.total > 0) {
          await tx.sesionProducto.create({
            data: {
              sesionId: nuevaSesion.id,
              productoId: producto.id,
              mencionesSesion: contador.total,
              positivosSesion: contador.positivos,
              negativosSesion: contador.negativos,
              neutralesSesion: contador.neutrales,
            },
          });
        }
      }

      return nuevaSesion;
    });

    const productosDetectados = [];
    for (const producto of productosMap.values()) {
      const contador = contadores.get(producto.id)!;
      if (contador.total > 0) {
        await productoService.actualizarContadores(producto.id, contador.positivos, contador.negativos, contador.neutrales);
        productosDetectados.push({
          nombreProducto: producto.nombre,
          totalMencionesEnSesion: contador.total,
          positivosEnSesion: contador.positivos,
          negativosEnSesion: contador.negativos,
          neutralesEnSesion: contador.neutrales,
          porcentajeMenciones: stats.total > 0 ? (contador.total * 100) / stats.total : 0,
        });
      }
    }

    return {
      sessionId: sesion.id,
      date: sesion.fecha.toISOString(),
      ...stats,
      productosDetectados,
      comentarios: entradasValidas.map((entrada, i) => ({
        texto: entrada.texto.trim(),
        sentimiento: resultados[i].prevision,
        probabilidad: resultados[i].probabilidad,
        productoAsociado: entrada.producto?.trim() ?? null,
      })),
    };
  },
};
