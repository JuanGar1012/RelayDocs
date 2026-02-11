import { type NextFunction, type Response } from "express";
import { jwtVerify } from "jose";
import type { AuthenticatedRequest } from "../types.js";

const TOKEN_PREFIX = "dev-token-";

function getBearerToken(request: AuthenticatedRequest): string | null {
  const authorizationHeader = request.header("authorization");

  if (!authorizationHeader || !authorizationHeader.startsWith("Bearer ")) {
    return null;
  }

  return authorizationHeader.slice("Bearer ".length).trim();
}

function allowDevTokens(): boolean {
  return process.env.ALLOW_DEV_TOKENS !== "false";
}

function getJwtSecret(): string | null {
  const secret = process.env.JWT_SECRET;
  return typeof secret === "string" && secret.length > 0 ? secret : null;
}

export async function requireAuth(
  request: AuthenticatedRequest,
  response: Response,
  next: NextFunction
): Promise<void> {
  const token = getBearerToken(request);

  if (!token) {
    response.status(401).json({ message: "Unauthorized" });
    return;
  }

  if (allowDevTokens() && token.startsWith(TOKEN_PREFIX)) {
    const userId = token.slice(TOKEN_PREFIX.length);

    if (userId.length === 0) {
      response.status(401).json({ message: "Invalid token" });
      return;
    }

    request.authUserId = userId;
    next();
    return;
  }

  const secret = getJwtSecret();

  if (!secret) {
    response.status(401).json({ message: "Invalid token" });
    return;
  }

  try {
    const verified = await jwtVerify(token, new TextEncoder().encode(secret));
    const subject = verified.payload.sub;

    if (typeof subject !== "string" || subject.length === 0) {
      response.status(401).json({ message: "Invalid token" });
      return;
    }

    request.authUserId = subject;
    next();
  } catch {
    response.status(401).json({ message: "Invalid token" });
  }
}