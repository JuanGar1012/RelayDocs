import { randomUUID } from "node:crypto";
import { type NextFunction, type Request, type Response } from "express";
import { runWithRequestContext } from "../context/requestContext.js";

const REQUEST_ID_HEADER = "x-request-id";

function getRequestIdFromHeader(request: Request): string | null {
  const headerValue = request.header(REQUEST_ID_HEADER);
  if (!headerValue || headerValue.trim().length === 0) {
    return null;
  }

  return headerValue.trim();
}

export function requestContextMiddleware(request: Request, response: Response, next: NextFunction): void {
  const requestId = getRequestIdFromHeader(request) ?? randomUUID();
  response.setHeader(REQUEST_ID_HEADER, requestId);
  runWithRequestContext(requestId, next);
}

