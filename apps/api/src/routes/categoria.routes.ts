import { Router } from "express";
import { categoriaController } from "../controllers/categoria.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const categoriaRoutes = Router();
categoriaRoutes.use(requireAuth);

categoriaRoutes.post("/", asyncHandler(categoriaController.crear));
categoriaRoutes.get("/", asyncHandler(categoriaController.listar));
categoriaRoutes.get("/:categoriaId", asyncHandler(categoriaController.obtenerPorId));
