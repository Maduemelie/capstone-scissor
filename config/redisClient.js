const redis = require("redis");

// Create a Redis client
const redisClient = redis.createClient({
  host: "127.0.0.1",
  port: 6379,
});

// Handle Redis client connection errors
redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

// Wait for Redis client to connect
redisClient.on("connect", () => {
  console.log("Connected to Redis");

  // Use the Redis client to execute commands here
  // ...
  redisClient.set("name", "john", (error, result) => {
    if (error) {
      console.error("Error setting Redis key:", error);
    } else {
      console.log("Redis key set successfully");
    }
  });
});

module.exports = redisClient;
