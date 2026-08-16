import { Router } from "express";
import { productoController } from "../controllers/producto.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const productoRoutes = Router();
productoRoutes.use(requireAuth);

productoRoutes.post("/", asyncHandler(productoController.crear));
productoRoutes.get("/", asyncHandler(productoController.listar));
// Registrado antes de "/:productoId" para que no lo intercepte la ruta con parámetro.
productoRoutes.get("/por-categoria", asyncHandler(productoController.listarPorCategoria));
productoRoutes.get("/:productoId", asyncHandler(productoController.obtenerPorId));
