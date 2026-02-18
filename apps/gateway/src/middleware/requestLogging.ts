import { type NextFunction, type Request, type Response } from "express";
import { getRequestId } from "../context/requestContext.js";

function serializeLog(payload: Record<string, string | number>): string {
  return JSON.stringify(payload);
}

export function requestLoggingMiddleware(request: Request, response: Response, next: NextFunction): void {
  const startedAt = Date.now();

  response.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const requestId = getRequestId() ?? "unknown";
    const route = request.originalUrl || request.url;

    console.info(
      serializeLog({
        level: "info",
        event: "http_request",
        requestId,
        method: request.method,
        route,
        statusCode: response.statusCode,
        durationMs
      })
    );
  });

  next();
}

