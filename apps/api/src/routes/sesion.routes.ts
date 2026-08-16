import { Router } from "express";
import { sesionController } from "../controllers/sesion.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const sesionRoutes = Router();
sesionRoutes.use(requireAuth);

sesionRoutes.post("/", asyncHandler(sesionController.guardar));
sesionRoutes.get("/", asyncHandler(sesionController.listar));
sesionRoutes.get("/historial", asyncHandler(sesionController.listar));
sesionRoutes.post("/analizar", asyncHandler(sesionController.analizar));
sesionRoutes.post("/analizar-con-producto", asyncHandler(sesionController.analizarConProducto));
sesionRoutes.get("/ultima-sesion-productos", asyncHandler(sesionController.ultimaSesionProductos));
sesionRoutes.post("/analizar-con-productos-previos", asyncHandler(sesionController.analizarConProductosPrevios));
sesionRoutes.post("/analizar-con-lista-productos", asyncHandler(sesionController.analizarConListaProductos));
sesionRoutes.post("/analizar-csv-batch", asyncHandler(sesionController.analizarCsvBatch));
