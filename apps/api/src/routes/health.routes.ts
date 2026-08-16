import { Router } from "express";
import { healthController } from "../controllers/health.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const healthRoutes = Router();
healthRoutes.get("/health", asyncHandler(healthController.health));
