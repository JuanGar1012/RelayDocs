import { type NextFunction, type Request, type Response } from "express";

export function securityHeaders(request: Request, response: Response, next: NextFunction): void {
  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("X-Frame-Options", "DENY");
  response.setHeader("Referrer-Policy", "no-referrer");
  response.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  response.setHeader("Cross-Origin-Resource-Policy", "same-site");
  response.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'");

  if (request.secure || request.header("x-forwarded-proto") === "https") {
    response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }

  next();
}

