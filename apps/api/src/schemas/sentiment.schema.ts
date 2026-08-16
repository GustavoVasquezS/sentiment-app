import { z } from "zod";

export const analyzeSingleSchema = z.object({
  texto: z.string().min(5, "El texto debe tener al menos 5 caracteres").max(2000),
});

export const analyzeBatchSchema = z.object({
  textos: z.array(z.string().min(1)).min(1).max(100),
});
