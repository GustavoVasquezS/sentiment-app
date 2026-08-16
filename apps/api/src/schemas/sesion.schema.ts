import { z } from "zod";

export const analizarComentariosSchema = z.object({
  comentarios: z.array(z.string().min(1)).min(1).max(100),
});

export const analizarConProductoSchema = z.object({
  comentarios: z.array(z.string().min(1)).min(1).max(100),
  productoId: z.number().int().positive(),
});

export const analizarConProductosPreviosSchema = z.object({
  comentarios: z.array(z.string().min(1)).min(1).max(100),
  sesionPreviaId: z.number().int().positive(),
});

export const analizarConListaProductosSchema = z.object({
  comentarios: z.array(z.string().min(1)).min(1).max(100),
  productosIds: z.array(z.number().int().positive()).min(1),
});

const csvEntradaSchema = z.object({
  texto: z.string().min(1),
  producto: z.string().min(1).optional(),
  categoria: z.string().min(1).optional(),
});

export const analizarCsvBatchSchema = z.object({
  entradas: z.array(csvEntradaSchema).min(1, "No hay entradas para analizar"),
});
