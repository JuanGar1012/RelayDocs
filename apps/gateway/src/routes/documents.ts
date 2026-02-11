import { Router, type Response } from "express";
import { ZodError } from "zod";
import {
  type DocumentServiceClient,
  DownstreamServiceError
} from "../client/documentServiceClient.js";
import { requireAuth } from "../middleware/requireAuth.js";
import {
  createDocumentBodySchema,
  shareDocumentBodySchema,
  updateDocumentBodySchema
} from "../schemas/documents.js";
import type { AuthenticatedRequest } from "../types.js";

function getAuthUserId(request: AuthenticatedRequest): string {
  const userId = request.authUserId;

  if (!userId) {
    throw new Error("Missing auth user id");
  }

  return userId;
}

function getDocumentIdParam(request: AuthenticatedRequest): string {
  const rawId = request.params.id;

  if (typeof rawId === "string" && rawId.length > 0) {
    return rawId;
  }

  throw new ZodError([
    {
      code: "custom",
      message: "Invalid document id",
      path: ["id"]
    }
  ]);
}

function mapError(response: Response, error: unknown): void {
  if (error instanceof ZodError) {
    response.status(400).json({ message: "Invalid request body", errors: error.issues });
    return;
  }

  if (error instanceof DownstreamServiceError) {
    if (error.statusCode >= 400 && error.statusCode < 500) {
      response.status(error.statusCode).json({ message: error.message });
      return;
    }

    response.status(502).json({ message: "Upstream service failure" });
    return;
  }

  response.status(500).json({ message: "Unexpected error" });
}

export function createDocumentRouter(documentServiceClient: DocumentServiceClient): Router {
  const router = Router();
  router.use(requireAuth);

  router.get("/", async (request: AuthenticatedRequest, response: Response) => {
    try {
      const userId = getAuthUserId(request);
      const documents = await documentServiceClient.listDocuments(userId);
      response.status(200).json({ documents });
    } catch (error: unknown) {
      mapError(response, error);
    }
  });

  router.post("/", async (request: AuthenticatedRequest, response: Response) => {
    try {
      const userId = getAuthUserId(request);
      const parsedBody = createDocumentBodySchema.parse(request.body);
      const document = await documentServiceClient.createDocument(userId, parsedBody);
      response.status(201).json({ document });
    } catch (error: unknown) {
      mapError(response, error);
    }
  });

  router.get("/:id", async (request: AuthenticatedRequest, response: Response) => {
    try {
      const userId = getAuthUserId(request);
      const document = await documentServiceClient.getDocument(userId, getDocumentIdParam(request));
      response.status(200).json({ document });
    } catch (error: unknown) {
      mapError(response, error);
    }
  });

  router.patch("/:id", async (request: AuthenticatedRequest, response: Response) => {
    try {
      const userId = getAuthUserId(request);
      const parsedBody = updateDocumentBodySchema.parse(request.body);
      const document = await documentServiceClient.updateDocument(
        userId,
        getDocumentIdParam(request),
        parsedBody
      );
      response.status(200).json({ document });
    } catch (error: unknown) {
      mapError(response, error);
    }
  });

  router.post("/:id/share", async (request: AuthenticatedRequest, response: Response) => {
    try {
      const userId = getAuthUserId(request);
      const parsedBody = shareDocumentBodySchema.parse(request.body);
      const document = await documentServiceClient.shareDocument(
        userId,
        getDocumentIdParam(request),
        parsedBody
      );
      response.status(200).json({ document });
    } catch (error: unknown) {
      mapError(response, error);
    }
  });

  return router;
}
