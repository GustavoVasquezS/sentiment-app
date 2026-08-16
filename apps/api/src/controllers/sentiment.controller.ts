import type { Request, Response } from "express";
import { sentimentService } from "../services/sentiment.service.js";
import { analyzeSingleSchema, analyzeBatchSchema } from "../schemas/sentiment.schema.js";

export const sentimentController = {
  ping(_req: Request, res: Response) {
    res.type("text/plain").send("retornando mensaje de prueba");
  },

  async analyze(req: Request, res: Response) {
    const { texto } = analyzeSingleSchema.parse(req.body);
    const result = await sentimentService.analizarTexto(texto);
    res.json(result);
  },

  async analyzeBatch(req: Request, res: Response) {
    const { textos } = analyzeBatchSchema.parse(req.body);
    const results = await sentimentService.analizarTextos(textos);
    res.json({ results });
  },
};
