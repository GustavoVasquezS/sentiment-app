import { prisma } from "../lib/prisma.js";
import { NotFoundError } from "../errors/AppError.js";
import { buildPaginatedResult, toPrismaSkipTake, type PaginationParams } from "../lib/pagination.js";

export const categoriaService = {
  async crear(usuarioId: number, nombreCategoria: string, descripcion?: string) {
    return prisma.categoria.create({
      data: { nombre: nombreCategoria, descripcion, usuarioId },
    });
  },

  async listar(usuarioId: number, pagination: PaginationParams) {
    const where = { usuarioId };
    const [categorias, total] = await Promise.all([
      prisma.categoria.findMany({
        where,
        ...toPrismaSkipTake(pagination),
        orderBy: { id: "desc" },
        include: { _count: { select: { productos: true } } },
      }),
      prisma.categoria.count({ where }),
    ]);

    const data = categorias.map((c) => ({
      categoriaId: c.id,
      nombreCategoria: c.nombre,
      descripcion: c.descripcion,
      totalProductos: c._count.productos,
    }));

    return buildPaginatedResult(data, total, pagination);
  },

  async obtenerPorId(usuarioId: number, categoriaId: number) {
    const categoria = await prisma.categoria.findFirst({
      where: { id: categoriaId, usuarioId },
      include: { _count: { select: { productos: true } } },
    });

    if (!categoria) {
      throw new NotFoundError("Categoría no encontrada");
    }

    return {
      categoriaId: categoria.id,
      nombreCategoria: categoria.nombre,
      descripcion: categoria.descripcion,
      totalProductos: categoria._count.productos,
    };
  },

  // Usado por la importación CSV (auto-creación de categorías que no
  // existen todavía) — puerto de findByNombreCategoriaAndUsuario(...).
  async findOrCreate(usuarioId: number, nombre: string, descripcion = "Auto-creada desde CSV") {
    const existente = await prisma.categoria.findFirst({
      where: { usuarioId, nombre: { equals: nombre, mode: "insensitive" } },
    });
    if (existente) return existente;

    return prisma.categoria.create({ data: { nombre, descripcion, usuarioId } });
  },
};
