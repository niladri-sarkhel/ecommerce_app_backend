import Redis from "ioredis";
import { env } from "#config";
import { logger } from "#utils"; // Reusing your logger

const redisConfig = {
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Essential for handling reconnections cleanly
};

// Initialize the client
export const redis = new Redis(redisConfig);

// Event Listeners for infrastructure visibility
redis.on("connect", () => {
  logger.info("⚡ Redis cluster connection successfully initialized.");
});

redis.on("error", (error) => {
  logger.error("❌ Redis critical transport error:", error);
});
