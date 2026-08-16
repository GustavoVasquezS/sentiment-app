import { Router } from "express";
import { sentimentController } from "../controllers/sentiment.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

// Público, igual que en el backend Java original (sin auth): el análisis
// de sentimiento suelto no requiere sesión, solo cuando se guarda asociado
// a un usuario (ver sesion.routes.ts).
export const sentimentRoutes = Router();

sentimentRoutes.get("/", sentimentController.ping);
sentimentRoutes.post("/", asyncHandler(sentimentController.analyze));
sentimentRoutes.post("/batch", asyncHandler(sentimentController.analyzeBatch));
