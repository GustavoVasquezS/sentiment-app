import { prisma } from "../lib/prisma.js";
import { hashPassword, comparePassword } from "../lib/password.js";
import { signToken } from "../lib/jwt.js";
import { generateResetToken, hashResetToken } from "../lib/resetToken.js";
import { sendPasswordResetEmail } from "../lib/email.js";
import { ConflictError, NotFoundError, UnauthorizedError, ValidationFailedError } from "../errors/AppError.js";
import { CATEGORIAS_DEFAULT } from "../lib/defaultCategorias.js";
import type { registroSchema, loginSchema } from "../schemas/usuario.schema.js";
import type { z } from "zod";

type RegistroInput = z.infer<typeof registroSchema>;
type LoginInput = z.infer<typeof loginSchema>;

export const authService = {
  async registrar(input: RegistroInput) {
    const existente = await prisma.usuario.findUnique({ where: { correo: input.correo } });
    if (existente) {
      throw new ConflictError("Ya existe un usuario registrado con ese correo");
    }

    const passwordHash = await hashPassword(input.contrasena);
    const rolUser = await prisma.rol.upsert({
      where: { nombre: "USER" },
      update: {},
      create: { nombre: "USER" },
    });

    const usuario = await prisma.usuario.create({
      data: {
        nombre: input.nombre,
        apellido: input.apellido,
        correo: input.correo,
        passwordHash,
        roles: { create: [{ rolId: rolUser.id }] },
        categorias: {
          create: CATEGORIAS_DEFAULT.map((nombre) => ({ nombre })),
        },
      },
    });

    return { id: usuario.id, nombre: usuario.nombre, apellido: usuario.apellido, correo: usuario.correo };
  },

  async login(input: LoginInput) {
    const usuario = await prisma.usuario.findUnique({ where: { correo: input.correo } });
    if (!usuario) {
      throw new UnauthorizedError();
    }

    const valido = await comparePassword(input.contrasena, usuario.passwordHash);
    if (!valido) {
      throw new UnauthorizedError();
    }

    const token = signToken({ usuarioId: usuario.id });

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      correo: usuario.correo,
      token,
    };
  },

  async forgotPassword(correo: string): Promise<void> {
    const usuario = await prisma.usuario.findUnique({ where: { correo } });
    if (!usuario) {
      throw new NotFoundError("No existe un usuario con ese correo");
    }

    const { raw, hash, expiresAt } = generateResetToken();
    await prisma.passwordResetToken.create({
      data: { tokenHash: hash, usuarioId: usuario.id, expiresAt },
    });

    await sendPasswordResetEmail(usuario.correo, raw);
  },

  async resetPassword(rawToken: string, nuevaContrasena: string): Promise<void> {
    const tokenHash = hashResetToken(rawToken);
    const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!resetToken || resetToken.usedAt || resetToken.expiresAt < new Date()) {
      throw new ValidationFailedError("Token inválido o expirado");
    }

    const passwordHash = await hashPassword(nuevaContrasena);

    await prisma.$transaction([
      prisma.usuario.update({
        where: { id: resetToken.usuarioId },
        data: { passwordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { usedAt: new Date() },
      }),
    ]);
  },
};
