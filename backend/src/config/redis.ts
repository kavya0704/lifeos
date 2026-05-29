import { createClient, RedisClientType } from "redis";

let redisClient: RedisClientType;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    redisClient = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
    });

    redisClient.on("error", (err) => {
      console.error("Redis Client Error:", err);
    });

    redisClient.on("connect", () => {
      console.log("✅ Redis connected");
    });

    await redisClient.connect();
  }

  return redisClient;
}

export { redisClient };
