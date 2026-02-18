import { authControlsConfig } from "./authControlsConfig.js";
import { getRedisClient } from "./redisClient.js";

interface LockoutEntry {
  failures: number;
  firstFailureAt: number;
  lockedUntil: number;
}

const inMemoryLockouts = new Map<string, LockoutEntry>();

function createKey(username: string, ip: string): string {
  return `${username.toLowerCase()}::${ip}`;
}

function getNow(): number {
  return Date.now();
}

function getRedisLockKey(key: string): string {
  return `auth:lock:${key}`;
}

function getRedisFailureKey(key: string): string {
  return `auth:fail:${key}`;
}

async function isLockedInRedis(key: string): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) {
    return false;
  }

  const lockKey = getRedisLockKey(key);
  const lockTtlMs = await redis.pTTL(lockKey);
  return lockTtlMs > 0;
}

async function recordFailureInRedis(key: string): Promise<boolean> {
  const redis = await getRedisClient();
  if (!redis) {
    return false;
  }

  const failureKey = getRedisFailureKey(key);
  const lockKey = getRedisLockKey(key);

  const failureCount = await redis.incr(failureKey);
  if (failureCount === 1) {
    await redis.pExpire(failureKey, authControlsConfig.lockoutWindowMs);
  }

  if (failureCount >= authControlsConfig.lockoutThreshold) {
    await redis.set(lockKey, "1", {
      PX: authControlsConfig.lockoutDurationMs
    });
    await redis.del(failureKey);
    return true;
  }

  return false;
}

async function clearFailuresInRedis(key: string): Promise<void> {
  const redis = await getRedisClient();
  if (!redis) {
    return;
  }

  await redis.del(getRedisFailureKey(key));
}

function isLockedInMemory(key: string): boolean {
  const now = getNow();
  const existing = inMemoryLockouts.get(key);
  if (!existing) {
    return false;
  }

  if (existing.lockedUntil > now) {
    return true;
  }

  if (existing.firstFailureAt + authControlsConfig.lockoutWindowMs <= now) {
    inMemoryLockouts.delete(key);
    return false;
  }

  if (existing.lockedUntil > 0 && existing.lockedUntil <= now) {
    inMemoryLockouts.delete(key);
    return false;
  }

  return false;
}

function recordFailureInMemory(key: string): boolean {
  const now = getNow();
  const existing = inMemoryLockouts.get(key);

  if (!existing || existing.firstFailureAt + authControlsConfig.lockoutWindowMs <= now) {
    inMemoryLockouts.set(key, {
      failures: 1,
      firstFailureAt: now,
      lockedUntil: 0
    });
    return false;
  }

  const updatedFailures = existing.failures + 1;
  const lockedUntil =
    updatedFailures >= authControlsConfig.lockoutThreshold ? now + authControlsConfig.lockoutDurationMs : 0;

  inMemoryLockouts.set(key, {
    failures: updatedFailures,
    firstFailureAt: existing.firstFailureAt,
    lockedUntil
  });

  return lockedUntil > now;
}

function clearFailuresInMemory(key: string): void {
  inMemoryLockouts.delete(key);
}

export async function isAccountLocked(username: string, ip: string): Promise<boolean> {
  const key = createKey(username, ip);
  const lockedInRedis = await isLockedInRedis(key);
  if (lockedInRedis) {
    return true;
  }

  return isLockedInMemory(key);
}

export async function recordAuthFailure(username: string, ip: string): Promise<boolean> {
  const key = createKey(username, ip);
  const lockedInRedis = await recordFailureInRedis(key);
  if (lockedInRedis) {
    return true;
  }

  return recordFailureInMemory(key);
}

export async function clearAuthFailures(username: string, ip: string): Promise<void> {
  const key = createKey(username, ip);
  await clearFailuresInRedis(key);
  clearFailuresInMemory(key);
}

