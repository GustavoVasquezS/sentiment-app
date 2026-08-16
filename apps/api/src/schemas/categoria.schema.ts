import { z } from "zod";

export const crearCategoriaSchema = z.object({
  nombreCategoria: z.string().min(1).max(100),
  descripcion: z.string().max(255).optional(),
});

export const categoriaIdParamSchema = z.object({
  categoriaId: z.coerce.number().int().positive(),
});
