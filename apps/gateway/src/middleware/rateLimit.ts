import { type NextFunction, type Request, type Response } from "express";

interface RateLimitEntry {
  count: number;
  windowStartedAt: number;
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyExtractor: (request: Request) => string;
}

function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? String(fallback), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

function getClientIp(request: Request): string {
  if (typeof request.ip === "string" && request.ip.length > 0) {
    return request.ip;
  }

  return "unknown";
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const entries = new Map<string, RateLimitEntry>();

  return (request: Request, response: Response, next: NextFunction): void => {
    const key = options.keyExtractor(request);
    const now = Date.now();
    const existing = entries.get(key);

    if (!existing || now - existing.windowStartedAt >= options.windowMs) {
      entries.set(key, { count: 1, windowStartedAt: now });
      next();
      return;
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((options.windowMs - (now - existing.windowStartedAt)) / 1000);
      response.setHeader("Retry-After", String(Math.max(retryAfterSeconds, 1)));
      response.status(429).json({ message: "Too many requests" });
      return;
    }

    existing.count += 1;
    next();
  };
}

export const authRateLimit = createRateLimitMiddleware({
  maxRequests: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  windowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60000),
  keyExtractor: getClientIp
});
