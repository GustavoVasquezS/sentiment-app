import { extendZodWithOpenApi, OpenApiGeneratorV3, OpenAPIRegistry } from "@asteasolutions/zod-to-openapi";
import { z } from "zod";
import { registroSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from "../schemas/usuario.schema.js";
import { crearCategoriaSchema } from "../schemas/categoria.schema.js";
import { crearProductoSchema } from "../schemas/producto.schema.js";
import { analyzeSingleSchema, analyzeBatchSchema } from "../schemas/sentiment.schema.js";

extendZodWithOpenApi(z);

// La doc OpenAPI se genera desde los mismos esquemas zod que validan los
// requests (ver middleware/validate.middleware.ts y los controllers), así
// nunca puede desincronizarse de lo que la API realmente acepta.
const registry = new OpenAPIRegistry();

registry.registerPath({
  method: "post",
  path: "/usuario",
  summary: "Registrar un nuevo usuario",
  request: { body: { content: { "application/json": { schema: registroSchema } } } },
  responses: { 201: { description: "Usuario registrado" } },
});

registry.registerPath({
  method: "post",
  path: "/usuario/login",
  summary: "Iniciar sesión",
  request: { body: { content: { "application/json": { schema: loginSchema } } } },
  responses: { 200: { description: "Login exitoso, retorna JWT" } },
});

registry.registerPath({
  method: "post",
  path: "/usuario/forgot-password",
  summary: "Solicitar recuperación de contraseña",
  request: { body: { content: { "application/json": { schema: forgotPasswordSchema } } } },
  responses: { 200: { description: "Correo de recuperación enviado" } },
});

registry.registerPath({
  method: "post",
  path: "/usuario/reset-password",
  summary: "Restablecer contraseña con token",
  request: { body: { content: { "application/json": { schema: resetPasswordSchema } } } },
  responses: { 200: { description: "Contraseña actualizada" } },
});

registry.registerPath({
  method: "post",
  path: "/categoria",
  summary: "Crear categoría (requiere JWT)",
  request: { body: { content: { "application/json": { schema: crearCategoriaSchema } } } },
  responses: { 201: { description: "Categoría creada" } },
});

registry.registerPath({
  method: "post",
  path: "/producto",
  summary: "Crear producto (requiere JWT)",
  request: { body: { content: { "application/json": { schema: crearProductoSchema } } } },
  responses: { 201: { description: "Producto creado" } },
});

registry.registerPath({
  method: "post",
  path: "/sentiment/analyze",
  summary: "Analizar sentimiento de un texto",
  request: { body: { content: { "application/json": { schema: analyzeSingleSchema } } } },
  responses: { 200: { description: "prevision, probabilidad, review_required" } },
});

registry.registerPath({
  method: "post",
  path: "/sentiment/analyze/batch",
  summary: "Analizar sentimiento de hasta 100 textos",
  request: { body: { content: { "application/json": { schema: analyzeBatchSchema } } } },
  responses: { 200: { description: "Lista de resultados en el mismo orden" } },
});

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);
  return generator.generateDocument({
    openapi: "3.0.0",
    info: { title: "Sentiment App API", version: "1.0.0" },
    servers: [{ url: "/project/api/v2" }],
  });
}
