import type { Request, Response } from "express";
import { productoService } from "../services/producto.service.js";
import { crearProductoSchema, productoPorCategoriaQuerySchema } from "../schemas/producto.schema.js";
import { paginationQuerySchema } from "../schemas/pagination.schema.js";

export const productoController = {
  async crear(req: Request, res: Response) {
    const input = crearProductoSchema.parse(req.body);
    const producto = await productoService.crear(req.usuarioId!, input.nombreProducto, input.categoriaId);
    res.status(201).json(producto);
  },

  async listar(req: Request, res: Response) {
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await productoService.listar(req.usuarioId!, pagination);
    res.json(result);
  },

  async listarPorCategoria(req: Request, res: Response) {
    const { categoriaId } = productoPorCategoriaQuerySchema.parse(req.query);
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await productoService.listarPorCategoria(req.usuarioId!, categoriaId, pagination);
    res.json(result);
  },

  async obtenerPorId(req: Request, res: Response) {
    const productoId = Number(req.params.productoId);
    const producto = await productoService.obtenerPorId(req.usuarioId!, productoId);
    res.json(producto);
  },
};
