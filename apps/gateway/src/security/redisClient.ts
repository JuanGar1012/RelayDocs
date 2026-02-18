import { createClient } from "redis";

export interface RedisClientLike {
  connect(): Promise<void>;
  incr(key: string): Promise<number>;
  pExpire(key: string, milliseconds: number): Promise<number>;
  pTTL(key: string): Promise<number>;
  set(key: string, value: string, options?: { PX?: number }): Promise<string | null>;
  del(keys: string | string[]): Promise<number>;
  on(event: "error", listener: (error: unknown) => void): this;
}

let redisClientPromise: Promise<RedisClientLike | null> | null = null;

async function connectRedisClient(redisUrl: string): Promise<RedisClientLike | null> {
  try {
    const client = createClient({ url: redisUrl }) as unknown as RedisClientLike;
    client.on("error", (error) => {
      console.error("Redis client error:", error);
    });
    await client.connect();
    return client;
  } catch (error) {
    console.error("Failed to connect to Redis, falling back to in-memory controls:", error);
    return null;
  }
}

export function getRedisClient(): Promise<RedisClientLike | null> {
  const redisUrl = process.env.REDIS_URL;

  if (!redisUrl || redisUrl.trim().length === 0) {
    return Promise.resolve(null);
  }

  if (!redisClientPromise) {
    redisClientPromise = connectRedisClient(redisUrl);
  }

  return redisClientPromise;
}
