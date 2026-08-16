import type { Request, Response } from "express";
import { authService } from "../services/auth.service.js";
import { registroSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/usuario.schema.js";

export const usuarioController = {
  async registrar(req: Request, res: Response) {
    const input = registroSchema.parse(req.body);
    await authService.registrar(input);
    res.status(201).json({ message: "Usuario registrado exitosamente" });
  },

  async login(req: Request, res: Response) {
    const input = loginSchema.parse(req.body);
    const result = await authService.login(input);
    res.json(result);
  },

  async forgotPassword(req: Request, res: Response) {
    const { correo } = forgotPasswordSchema.parse(req.body);
    await authService.forgotPassword(correo);
    res.json({ message: "Correo de recuperación enviado" });
  },

  async resetPassword(req: Request, res: Response) {
    const { token, nuevaContrasena } = resetPasswordSchema.parse(req.body);
    await authService.resetPassword(token, nuevaContrasena);
    res.json({ message: "Contraseña actualizada correctamente" });
  },
};
