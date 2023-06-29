const redis = require("redis");
require('dotenv').config()
// Create a Redis client
const password = process.env.REDIS_PASSWORD;

const redisClient = redis.createClient({
  password: password,
  socket: {
      host: 'redis-10922.c11.us-east-1-3.ec2.cloud.redislabs.com',
      port: 10922
  }
});
// Handle Redis client connection errors
redisClient.on("error", (error) => {
  console.error("Redis connection error:", error);
});

// Wait for Redis client to connect
redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

module.exports = redisClient;
