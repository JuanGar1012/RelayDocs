import { SignJWT } from "jose";
import { Router, type Request, type Response } from "express";
import { ZodError } from "zod";
import { getJwtSecret } from "../config/runtime.js";
import {
  type DocumentServiceClient,
  DownstreamServiceError
} from "../client/documentServiceClient.js";
import { loginBodySchema, signupBodySchema } from "../schemas/auth.js";
import { clearAuthFailures, isAccountLocked, recordAuthFailure } from "../security/authLockout.js";

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
      const requestIp = getRequestIp(request);
      const locked = await isAccountLocked(body.username, requestIp);
      if (locked) {
        response.status(429).json({ message: "Account temporarily locked. Try again later." });
        return;
      }

      const user = await documentServiceClient.login(body);
      await clearAuthFailures(body.username, requestIp);
      const token = await issueToken(user.userId);
      response.status(200).json({ token, userId: user.userId });
    } catch (error: unknown) {
      if (error instanceof DownstreamServiceError && error.statusCode === 401) {
        const body = loginBodySchema.safeParse(request.body);
        if (body.success) {
          const requestIp = getRequestIp(request);
          const nowLocked = await recordAuthFailure(body.data.username, requestIp);
          if (nowLocked) {
            response.status(429).json({ message: "Account temporarily locked. Try again later." });
            return;
          }
        }
      }

      mapError(response, error);
    }
  });

  return router;
}

function getRequestIp(request: Request): string {
  if (typeof request.ip === "string" && request.ip.length > 0) {
    return request.ip;
  }

  return "unknown";
}
