import cors from "cors";
import express, { type Request, type Response } from "express";
import { z } from "zod";
import {
  createHttpDocumentServiceClient,
  type DocumentServiceClient
} from "./client/documentServiceClient.js";
import { createDocumentRouter } from "./routes/documents.js";

interface CreateAppOptions {
  documentServiceClient?: DocumentServiceClient;
}

export function createApp(options?: CreateAppOptions): express.Express {
  const app = express();
  app.use(
    cors({
      origin: process.env.WEB_ORIGIN ?? "http://localhost:5173"
    })
  );
  app.use(express.json());

  const documentServiceClient =
    options?.documentServiceClient ??
    createHttpDocumentServiceClient(process.env.DOCUMENT_SERVICE_BASE_URL ?? "http://localhost:8081");

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

  app.use("/api/v1/documents", createDocumentRouter(documentServiceClient));

  return app;
}
