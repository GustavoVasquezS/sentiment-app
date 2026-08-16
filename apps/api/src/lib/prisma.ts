import { PrismaClient } from "@prisma/client";

// Singleton: evita abrir un pool de conexiones nuevo por cada import,
// especialmente relevante con tsx watch / hot reload en desarrollo.
export const prisma = new PrismaClient();
