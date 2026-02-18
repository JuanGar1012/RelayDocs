import cors from "cors";
import express, { type Request, type Response } from "express";
import { z } from "zod";
import {
  createHttpDocumentServiceClient,
  type DocumentServiceClient
} from "./client/documentServiceClient.js";
import { requestContextMiddleware } from "./middleware/requestContext.js";
import { authRateLimit } from "./middleware/rateLimit.js";
import { requestLoggingMiddleware } from "./middleware/requestLogging.js";
import { securityHeaders } from "./middleware/securityHeaders.js";
import { createAuthRouter } from "./routes/auth.js";
import { createDocumentRouter } from "./routes/documents.js";

interface CreateAppOptions {
  documentServiceClient?: DocumentServiceClient;
  readinessProbe?: () => Promise<boolean>;
}

export function createApp(options?: CreateAppOptions): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", process.env.TRUST_PROXY === "true");

  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173"
    })
  );
  app.use(securityHeaders);
  app.use(requestContextMiddleware);
  app.use(requestLoggingMiddleware);
  app.use(express.json());

  const documentServiceBaseUrl = process.env.DOCUMENT_SERVICE_BASE_URL ?? "http://localhost:8081";
  const documentServiceClient =
    options?.documentServiceClient ??
    createHttpDocumentServiceClient(documentServiceBaseUrl);

  const readinessProbe =
    options?.readinessProbe ??
    (async (): Promise<boolean> => {
      try {
        const response = await fetch(`${documentServiceBaseUrl}/ready`, {
          signal: AbortSignal.timeout(1500)
        });

        return response.ok;
      } catch {
        return false;
      }
    });

  const healthResponseSchema = z.object({
    service: z.literal("gateway"),
    status: z.literal("ok")
  });

  app.get("/health", (_request: Request, response: Response) => {
    const payload = healthResponseSchema.parse({
      service: "gateway",
      status: "ok"
    });

    response.status(200).json(payload);
  });

  app.get("/ready", async (_request: Request, response: Response) => {
    const isDocumentServiceReady = await readinessProbe();
    const payload = {
      service: "gateway",
      status: isDocumentServiceReady ? "ok" : "degraded",
      dependencies: {
        documentService: isDocumentServiceReady ? "ok" : "unavailable"
      }
    } as const;

    response.status(isDocumentServiceReady ? 200 : 503).json(payload);
  });

  app.use("/api/v1/auth", authRateLimit);
  app.use("/api/v1/documents", createDocumentRouter(documentServiceClient));
  app.use("/api/v1/auth", createAuthRouter(documentServiceClient));

  return app;
}
