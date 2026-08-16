import { z } from "zod";

export const crearProductoSchema = z.object({
  nombreProducto: z.string().min(1).max(200),
  categoriaId: z.coerce.number().int().positive(),
});

export const productoIdParamSchema = z.object({
  productoId: z.coerce.number().int().positive(),
});

export const productoPorCategoriaQuerySchema = z.object({
  categoriaId: z.coerce.number().int().positive(),
});
