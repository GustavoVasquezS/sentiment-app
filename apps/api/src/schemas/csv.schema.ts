import { z } from "zod";

const csvRowSchema = z.object({
  categoria: z.string().min(1),
  producto: z.string().min(1),
  comentario: z.string().min(1),
});

export const csvUploadSchema = z.object({
  rows: z.array(csvRowSchema).min(1, "El CSV no tiene filas para procesar"),
});
