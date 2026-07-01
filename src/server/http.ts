import express from "express";
import path from "path";
import apiRoutes from "../apiRoutes";
import { corsMiddleware } from "../middlewares/cors";
import { handleError } from "../errors";
import {
  globalErrorHandler,
  notFoundHandler,
} from "../middlewares/errorHandler";
import { morganMiddleware } from "../utils/logger";

export function createHttpServer() {
  const app = express();

  // Middlewares
  app.use(corsMiddleware);
  app.use(morganMiddleware);
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check endpoint
  app.get("/health", (req, res) => {
    res.status(200).json({
      success: true,
      message: "Server is healthy",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes
  app.use("/api", apiRoutes());
  app.use("/uploads", express.static(path.join(__dirname, "../../uploads")));

  // Ignore favicon requests if no icon file exists
  app.get("/favicon.ico", (_req, res) => res.status(204).end());

  // Frontend static pages (login, chat, group, settings)
  app.use(express.static(path.join(__dirname, "../../frontend/public")));

  // Error handlers - KnownErrors first, then the generic fallback
  app.use(notFoundHandler);
  app.use(handleError);
  app.use(globalErrorHandler);

  return app;
}
