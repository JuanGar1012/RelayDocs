function parsePositiveInt(rawValue: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(rawValue ?? String(fallback), 10);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
}

export const authControlsConfig = {
  rateLimitMax: parsePositiveInt(process.env.AUTH_RATE_LIMIT_MAX, 20),
  rateLimitWindowMs: parsePositiveInt(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60000),
  lockoutThreshold: parsePositiveInt(process.env.AUTH_LOCKOUT_THRESHOLD, 5),
  lockoutWindowMs: parsePositiveInt(process.env.AUTH_LOCKOUT_WINDOW_MS, 900000),
  lockoutDurationMs: parsePositiveInt(process.env.AUTH_LOCKOUT_DURATION_MS, 900000)
} as const;

