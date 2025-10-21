const express = require('express');
const config = require('./config');
const dbConnection = require('./database/connection');
const redisClient = require('./cache/redisClient');
const bloomFilterService = require('./services/bloomFilter');
const UrlService = require('./services/urlService');
const UrlRoutes = require('./routes/urlRoutes');
const { cors, requestLogger, errorHandler, notFoundHandler, rateLimiter } = require('./middleware');

class Server {
  constructor() {
    this.app = express();
    this.urlService = null;
    this.setupMiddleware();
  }

  setupMiddleware() {
    // Basic middleware
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(express.json());
    this.app.use(cors);
    this.app.use(requestLogger);
    this.app.use(rateLimiter);
  }

  async initialize() {
    try {
      // Initialize database connection
      await dbConnection.connect();
      
      // Initialize Redis connection
      await redisClient.connect();
      
      // Initialize Bloom filter
      bloomFilterService.initialize();
      await bloomFilterService.populateFromDatabase(dbConnection);
      
      // Initialize URL service
      this.urlService = new UrlService(dbConnection, redisClient, bloomFilterService);
      
      // Setup routes
      const urlRoutes = new UrlRoutes(this.urlService);
      this.app.use('/', urlRoutes.getRouter());
      
      // Error handling middleware (must be last)
      this.app.use(notFoundHandler);
      this.app.use(errorHandler);
      
      console.log("✅ All services initialized successfully");
    } catch (error) {
      console.error("❌ Initialization error:", error.message);
      throw error;
    }
  }

  start() {
    this.app.listen(config.server.port, () => {
      console.log(`🌻 Server running on port ${config.server.port}`);
    });
  }

  async stop() {
    try {
      await dbConnection.close();
      await redisClient.disconnect();
      console.log("✅ Server stopped gracefully");
    } catch (error) {
      console.error("❌ Error stopping server:", error.message);
    }
  }
}

// Create and export server instance
const server = new Server();

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await server.stop();
  process.exit(0);
});

module.exports = server;