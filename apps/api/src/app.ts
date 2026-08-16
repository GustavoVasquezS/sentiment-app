import express from "express";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import { allowedOrigins } from "./config/env.js";
import { usuarioRoutes } from "./routes/usuario.routes.js";
import { sentimentRoutes } from "./routes/sentiment.routes.js";
import { categoriaRoutes } from "./routes/categoria.routes.js";
import { productoRoutes } from "./routes/producto.routes.js";
import { sesionRoutes } from "./routes/sesion.routes.js";
import { csvRoutes } from "./routes/csv.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { errorMiddleware, notFoundMiddleware } from "./middleware/error.middleware.js";
import { generateOpenApiDocument } from "./openapi/registry.js";

// Se mantiene el mismo base path que el backend Java original
// (/project/api/v2) por continuidad con el frontend y cualquier link ya
// guardado.
const BASE_PATH = "/project/api/v2";

export function createApp() {
  const app = express();

  app.use(cors({ origin: allowedOrigins, credentials: true }));
  app.use(express.json({ limit: "2mb" }));

  const router = express.Router();
  router.use(healthRoutes);
  router.use("/usuario", usuarioRoutes);
  router.use("/sentiment/analyze", sentimentRoutes);
  router.use("/categoria", categoriaRoutes);
  router.use("/producto", productoRoutes);
  router.use("/sesion", sesionRoutes);
  router.use("/csv", csvRoutes);

  const openApiDoc = generateOpenApiDocument();
  router.get("/openapi.json", (_req, res) => res.json(openApiDoc));
  router.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiDoc));

  app.use(BASE_PATH, router);
  app.use(notFoundMiddleware);
  app.use(errorMiddleware);

  return app;
}
