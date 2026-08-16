import type { Request, Response } from "express";
import { sesionService } from "../services/sesion.service.js";
import {
  analizarComentariosSchema,
  analizarConProductoSchema,
  analizarConProductosPreviosSchema,
  analizarConListaProductosSchema,
  analizarCsvBatchSchema,
} from "../schemas/sesion.schema.js";
import { paginationQuerySchema } from "../schemas/pagination.schema.js";
import { z } from "zod";

const guardarSesionSchema = z.object({
  avgScore: z.number(),
  total: z.number().int(),
  positivos: z.number().int(),
  negativos: z.number().int(),
  neutrales: z.number().int(),
});

export const sesionController = {
  async guardar(req: Request, res: Response) {
    const input = guardarSesionSchema.parse(req.body);
    await sesionService.guardarSesion(req.usuarioId!, input);
    res.status(201).end();
  },

  async listar(req: Request, res: Response) {
    const pagination = paginationQuerySchema.parse(req.query);
    const result = await sesionService.obtenerSesionesPorUsuario(req.usuarioId!, pagination);
    res.json(result);
  },

  async analizar(req: Request, res: Response) {
    const { comentarios } = analizarComentariosSchema.parse(req.body);
    const sesion = await sesionService.analizarYGuardarComentarios(comentarios, req.usuarioId!);
    res.json(sesion);
  },

  async analizarConProducto(req: Request, res: Response) {
    const { comentarios, productoId } = analizarConProductoSchema.parse(req.body);
    const sesion = await sesionService.analizarYGuardarConProducto(comentarios, req.usuarioId!, productoId);
    res.json(sesion);
  },

  async ultimaSesionProductos(req: Request, res: Response) {
    const info = await sesionService.obtenerProductosUltimaSesion(req.usuarioId!);
    res.json(info ?? { mensaje: "No hay sesiones previas" });
  },

  async analizarConProductosPrevios(req: Request, res: Response) {
    const { comentarios, sesionPreviaId } = analizarConProductosPreviosSchema.parse(req.body);
    const sesion = await sesionService.analizarConMismosProductos(comentarios, req.usuarioId!, sesionPreviaId);
    res.json(sesion);
  },

  async analizarConListaProductos(req: Request, res: Response) {
    const { comentarios, productosIds } = analizarConListaProductosSchema.parse(req.body);
    const sesion = await sesionService.analizarConMultiplesProductos(comentarios, req.usuarioId!, productosIds);
    res.json(sesion);
  },

  async analizarCsvBatch(req: Request, res: Response) {
    const { entradas } = analizarCsvBatchSchema.parse(req.body);
    const sesion = await sesionService.analizarBatchConCsv(entradas, req.usuarioId!);
    res.json(sesion);
  },
};
