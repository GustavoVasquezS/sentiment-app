import { API_ENDPOINTS } from "../config/api";
import { formatUserName } from "../utils/formatName";
import type { AuthUser, RegisterInput } from "./types";

// Nota: el backend nuevo (apps/api) usa JSON en todos lados, incluyendo
// forgot/reset-password — el backend Java original usaba query params
// (@RequestParam) para esos dos endpoints. También el campo de contraseña
// pasa de "contraseña" a "contrasena" (ver prisma/schema.prisma) para
// evitar el problema de encoding que tenía la columna original.
export const authService = {
  async register(userData: RegisterInput): Promise<{ success: true; message: string; user: Omit<RegisterInput, "contraseña"> }> {
    const response = await fetch(API_ENDPOINTS.REGISTER, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre: userData.nombre,
        apellido: userData.apellido,
        correo: userData.correo,
        contrasena: userData.contraseña,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al registrar usuario");
    }

    const data = await response.json().catch(() => null);

    return {
      success: true,
      message: data?.message || "Registro exitoso",
      user: { nombre: userData.nombre, apellido: userData.apellido, correo: userData.correo },
    };
  },

  async forgotPassword(correo: string): Promise<{ success: true; message: string }> {
    const response = await fetch(API_ENDPOINTS.FORGOT_PASSWORD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al enviar el correo de recuperación");
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, message: data.message || "Correo enviado exitosamente" };
  },

  async resetPassword(token: string, nuevaContrasena: string): Promise<{ success: true; message: string }> {
    const response = await fetch(API_ENDPOINTS.RESET_PASSWORD, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, nuevaContrasena }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Error al restablecer la contraseña");
    }

    const data = await response.json().catch(() => ({}));
    return { success: true, message: data.message || "Contraseña actualizada exitosamente" };
  },

  async login(correo: string, contraseña: string): Promise<{ success: true; user: AuthUser }> {
    const response = await fetch(API_ENDPOINTS.LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correo, contrasena: contraseña }),
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("Credenciales incorrectas");
      throw new Error("Error al iniciar sesión");
    }

    const userData = await response.json();
    const nombreCompleto = formatUserName(userData.nombre, userData.apellido);

    return {
      success: true,
      user: {
        id: userData.id,
        correo: userData.correo,
        nombre: userData.nombre,
        apellido: userData.apellido,
        nombreCompleto,
        token: userData.token,
      },
    };
  },
};
