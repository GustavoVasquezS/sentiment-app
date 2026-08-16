import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/AppError.js";
import { buildPaginatedResult, toPrismaSkipTake, type PaginationParams } from "../lib/pagination.js";
import type { Producto } from "@prisma/client";

function toProductoDto(p: Producto & { categoria: { nombre: string } }) {
  const pct = (n: number) => (p.totalMenciones > 0 ? Math.round((n / p.totalMenciones) * 10000) / 100 : 0);

  return {
    productoId: p.id,
    nombreProducto: p.nombre,
    categoriaId: p.categoriaId,
    nombreCategoria: p.categoria.nombre,
    totalMenciones: p.totalMenciones,
    positivos: p.positivos,
    negativos: p.negativos,
    neutrales: p.neutrales,
    porcentajePositivos: pct(p.positivos),
    porcentajeNegativos: pct(p.negativos),
    porcentajeNeutrales: pct(p.neutrales),
    fechaCreacion: p.fechaCreacion.toISOString(),
    ultimaActualizacion: p.ultimaActualizacion?.toISOString() ?? null,
  };
}

export const productoService = {
  async crear(usuarioId: number, nombreProducto: string, categoriaId: number) {
    const categoria = await prisma.categoria.findFirst({ where: { id: categoriaId, usuarioId } });
    if (!categoria) {
      throw new NotFoundError("Categoría no encontrada");
    }

    const producto = await prisma.producto.create({
      data: { nombre: nombreProducto, categoriaId, usuarioId },
      include: { categoria: { select: { nombre: true } } },
    });

    return toProductoDto(producto);
  },

  async listar(usuarioId: number, pagination: PaginationParams) {
    const where = { usuarioId };
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        ...toPrismaSkipTake(pagination),
        orderBy: { id: "desc" },
        include: { categoria: { select: { nombre: true } } },
      }),
      prisma.producto.count({ where }),
    ]);

    return buildPaginatedResult(productos.map(toProductoDto), total, pagination);
  },

  async listarPorCategoria(usuarioId: number, categoriaId: number, pagination: PaginationParams) {
    const where = { usuarioId, categoriaId };
    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        ...toPrismaSkipTake(pagination),
        orderBy: { id: "desc" },
        include: { categoria: { select: { nombre: true } } },
      }),
      prisma.producto.count({ where }),
    ]);

    return buildPaginatedResult(productos.map(toProductoDto), total, pagination);
  },

  async obtenerPorId(usuarioId: number, productoId: number) {
    const producto = await prisma.producto.findFirst({
      where: { id: productoId, usuarioId },
      include: { categoria: { select: { nombre: true } } },
    });

    if (!producto) {
      throw new NotFoundError("Producto no encontrado");
    }

    return toProductoDto(producto);
  },

  // Puerto de Producto.incrementarContadores(...) — acumula menciones
  // detectadas en una sesión sobre los contadores totales del producto.
  async actualizarContadores(productoId: number, positivos: number, negativos: number, neutrales: number) {
    const menciones = positivos + negativos + neutrales;
    await prisma.producto.update({
      where: { id: productoId },
      data: {
        totalMenciones: { increment: menciones },
        positivos: { increment: positivos },
        negativos: { increment: negativos },
        neutrales: { increment: neutrales },
      },
    });
  },

  // Usado por la importación CSV — puerto de
  // findByNombreProductoAndUsuario(...) / findByNombreProductoIgnoreCaseAndCategoriaAndUsuario(...).
  async findOrCreate(usuarioId: number, nombre: string, categoriaId: number) {
    const existente = await prisma.producto.findFirst({
      where: { usuarioId, categoriaId, nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (existente) return existente;

    return prisma.producto.create({ data: { nombre, categoriaId, usuarioId } });
  },
};
