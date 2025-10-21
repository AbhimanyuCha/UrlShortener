const config = {
  server: {
    port: process.env.PORT || 8080,
  },
  database: {
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 5462,
    user: process.env.DB_USER || "postgres",
    database: process.env.DB_NAME || "postgres",
    password: process.env.DB_PASSWORD || "postgres",
    max: 32,
    connectionTimeoutMillis: 100,
    idleTimeoutMillis: 0
  },
  redis: {
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    url: `redis://${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`
  },
  bloomFilter: {
    capacity: 10000,
    falsePositiveRate: 0.01,
    bitArraySize: 96 * 1024,
    hashCount: 7
  },
  cache: {
    ttl: 3600 * 24 * 7 // 7 days in seconds
  }
};

module.exports = config;
