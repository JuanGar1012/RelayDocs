import { type NextFunction, type Request, type Response } from "express";
import { authControlsConfig } from "../security/authControlsConfig.js";
import { getRedisClient } from "../security/redisClient.js";

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
  keyExtractor: (request: Request) => string;
}

interface InMemoryWindow {
  count: number;
  windowStartedAt: number;
}

interface RateLimitResult {
  limited: boolean;
  retryAfterSeconds: number;
}

function getClientIp(request: Request): string {
  if (typeof request.ip === "string" && request.ip.length > 0) {
    return request.ip;
  }

  return "unknown";
}

export function createRateLimitMiddleware(options: RateLimitOptions) {
  const entries = new Map<string, InMemoryWindow>();

  async function consumeRedisWindow(key: string): Promise<RateLimitResult | null> {
    const redis = await getRedisClient();
    if (!redis) {
      return null;
    }

    const redisKey = `ratelimit:${key}`;
    const currentCount = await redis.incr(redisKey);
    if (currentCount === 1) {
      await redis.pExpire(redisKey, options.windowMs);
    }

    if (currentCount <= options.maxRequests) {
      return {
        limited: false,
        retryAfterSeconds: 0
      };
    }

    const timeToLiveMs = await redis.pTTL(redisKey);
    const retryAfterSeconds = Math.max(1, Math.ceil(Math.max(timeToLiveMs, 0) / 1000));
    return {
      limited: true,
      retryAfterSeconds
    };
  }

  function consumeInMemoryWindow(key: string): RateLimitResult {
    const now = Date.now();
    const existing = entries.get(key);

    if (!existing || now - existing.windowStartedAt >= options.windowMs) {
      entries.set(key, { count: 1, windowStartedAt: now });
      return {
        limited: false,
        retryAfterSeconds: 0
      };
    }

    if (existing.count >= options.maxRequests) {
      const retryAfterSeconds = Math.ceil((options.windowMs - (now - existing.windowStartedAt)) / 1000);
      return {
        limited: true,
        retryAfterSeconds: Math.max(retryAfterSeconds, 1)
      };
    }

    existing.count += 1;
    return {
      limited: false,
      retryAfterSeconds: 0
    };
  }

  return async (request: Request, response: Response, next: NextFunction): Promise<void> => {
    const key = options.keyExtractor(request);
    const redisResult = await consumeRedisWindow(key);
    const result = redisResult ?? consumeInMemoryWindow(key);

    if (result.limited) {
      response.setHeader("Retry-After", String(result.retryAfterSeconds));
      response.status(429).json({ message: "Too many requests" });
      return;
    }

    next();
  };
}

export const authRateLimit = createRateLimitMiddleware({
  maxRequests: authControlsConfig.rateLimitMax,
  windowMs: authControlsConfig.rateLimitWindowMs,
  keyExtractor: getClientIp
});
