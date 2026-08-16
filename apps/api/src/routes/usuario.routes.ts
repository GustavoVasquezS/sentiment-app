import { Router } from "express";
import { usuarioController } from "../controllers/usuario.controller.js";
import { asyncHandler } from "../middleware/asyncHandler.js";

export const usuarioRoutes = Router();

usuarioRoutes.post("/", asyncHandler(usuarioController.registrar));
usuarioRoutes.post("/login", asyncHandler(usuarioController.login));
usuarioRoutes.post("/forgot-password", asyncHandler(usuarioController.forgotPassword));
usuarioRoutes.post("/reset-password", asyncHandler(usuarioController.resetPassword));
