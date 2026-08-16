import type { Request, Response } from "express";
import { csvService } from "../services/csv.service.js";
import { csvUploadSchema } from "../schemas/csv.schema.js";

export const csvController = {
  async analizar(req: Request, res: Response) {
    const { rows } = csvUploadSchema.parse(req.body);
    const resultado = await csvService.procesarYAnalizarCsv(rows, req.usuarioId!);
    res.json(resultado);
  },

  async comparativaProductos(req: Request, res: Response) {
    const comparativa = await csvService.obtenerComparativaProductos(req.usuarioId!);
    res.json(comparativa);
  },

  async comparativaCategorias(req: Request, res: Response) {
    const comparativa = await csvService.obtenerComparativaCategorias(req.usuarioId!);
    res.json(comparativa);
  },
};
