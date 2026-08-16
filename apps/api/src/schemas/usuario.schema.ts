import { z } from "zod";

export const registroSchema = z.object({
  nombre: z.string().min(1).max(100),
  apellido: z.string().min(1).max(100),
  correo: z.string().email().max(255),
  contrasena: z.string().min(8, "La contraseña debe tener al menos 8 caracteres").max(72),
});

export const loginSchema = z.object({
  correo: z.string().email(),
  contrasena: z.string().min(1),
});

// A diferencia del backend Java original (que usaba @RequestParam / query
// string para forgot y reset password), acá se usa JSON body — más
// consistente con el resto de la API y con cómo lo consume el frontend.
export const forgotPasswordSchema = z.object({
  correo: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  nuevaContrasena: z.string().min(8).max(72),
});
