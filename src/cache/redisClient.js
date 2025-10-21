const redis = require('redis');
const config = require('../config');

class RedisClient {
  constructor() {
    this.client = null;
  }

  async connect() {
    try {
      this.client = redis.createClient({
        url: config.redis.url
      });

      this.client.on('error', (err) => console.error('❌ Redis Client Error', err));
      
      await this.client.connect();
      console.log("✅ Connected to Redis at:", config.redis.host);
      
      return this.client;
    } catch (error) {
      console.error("❌ Redis connection error:", error.message);
      throw error;
    }
  }

  async get(key) {
    if (!this.client) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client.get(key);
  }

  async set(key, value, options = {}) {
    if (!this.client) {
      throw new Error('Redis not connected. Call connect() first.');
    }
    return this.client.set(key, value, options);
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.client = null;
    }
  }
}

// Create a singleton instance
const redisClient = new RedisClient();

module.exports = redisClient;
