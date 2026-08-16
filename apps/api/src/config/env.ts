import "dotenv/config";
import { z } from "zod";

// Falla rapido al arrancar si falta o esta mal formada una env var, en vez
// de fallar mas tarde en un request cualquiera (equivalente TS del patron
// ${VAR:default} que usaba application.properties, pero validado).
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),
  DATABASE_URL: z.string().min(1, "DATABASE_URL es obligatoria"),
  JWT_SECRET: z.string().min(16, "JWT_SECRET debe tener al menos 16 caracteres"),
  JWT_EXPIRATION_SECONDS: z.coerce.number().int().positive().default(86400),
  ML_API_BASE_URL: z.string().url().default("http://localhost:8000"),
  RESEND_API_KEY: z.string().optional(),
  FRONTEND_URL: z.string().url().default("http://localhost:5173"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Variables de entorno inválidas:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const allowedOrigins = env.ALLOWED_ORIGINS.split(",")
  .map((o) => o.trim())
  .filter(Boolean);
