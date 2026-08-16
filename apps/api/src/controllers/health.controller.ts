import type { Request, Response } from "express";
import { prisma } from "../lib/prisma.js";

export const healthController = {
  // Público — usado como healthcheck de la plataforma de despliegue
  // (equivalente a GET /debug/health en el backend Java, ver railway.json).
  async health(_req: Request, res: Response) {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "healthy" });
  },
};
