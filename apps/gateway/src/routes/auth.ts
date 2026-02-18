import { SignJWT } from "jose";
import { Router, type Response } from "express";
import { ZodError } from "zod";
import { getJwtSecret } from "../config/runtime.js";
import {
  type DocumentServiceClient,
  DownstreamServiceError
} from "../client/documentServiceClient.js";
import { loginBodySchema, signupBodySchema } from "../schemas/auth.js";

function mapError(response: Response, error: unknown): void {
  if (error instanceof ZodError) {
    response.status(400).json({ message: "Invalid request", errors: error.issues });
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

async function issueToken(userId: string): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("2h")
    .sign(new TextEncoder().encode(getJwtSecret()));
}

export function createAuthRouter(documentServiceClient: DocumentServiceClient): Router {
  const router = Router();

  router.post("/signup", async (request, response) => {
    try {
      const body = signupBodySchema.parse(request.body);
      const user = await documentServiceClient.signup(body);
      const token = await issueToken(user.userId);
      response.status(201).json({ token, userId: user.userId });
    } catch (error: unknown) {
      mapError(response, error);
    }
  });

  router.post("/login", async (request, response) => {
    try {
      const body = loginBodySchema.parse(request.body);
      const user = await documentServiceClient.login(body);
      const token = await issueToken(user.userId);
      response.status(200).json({ token, userId: user.userId });
    } catch (error: unknown) {
      mapError(response, error);
    }
  });

  return router;
}
