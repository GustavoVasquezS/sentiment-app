import type { Request, Response } from "express";
import { categoriaService } from "../services/categoria.service.js";
import { crearCategoriaSchema } from "../schemas/categoria.schema.js";
import { paginationQuerySchema } from "../schemas/pagination.schema.js";

export const categoriaController = {
  async crear(req: Request, res: Response) {
    const input = crearCategoriaSchema.parse(req.body);
    const categoria = await categoriaService.crear(req.usuarioId!, input.nombreCategoria, input.descripcion);
    res.status(201).json(categoria);
  },

  async listar(req: Request, res: Response) {
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await categoriaService.listar(req.usuarioId!, pagination);
    res.json(result);
  },

  async obtenerPorId(req: Request, res: Response) {
    const categoriaId = Number(req.params.categoriaId);
    const categoria = await categoriaService.obtenerPorId(req.usuarioId!, categoriaId);
    res.json(categoria);
  },
};
