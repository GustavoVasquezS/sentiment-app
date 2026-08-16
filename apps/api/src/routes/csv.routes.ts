import { Router } from "express";
import { csvController } from "../controllers/csv.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const csvRoutes = Router();
csvRoutes.use(requireAuth);

csvRoutes.post("/analizar", asyncHandler(csvController.analizar));
csvRoutes.get("/comparativa-productos", asyncHandler(csvController.comparativaProductos));
csvRoutes.get("/comparativa-categorias", asyncHandler(csvController.comparativaCategorias));
