const server = require('./server');

async function startServer() {
  try {
    await server.initialize();
    server.start();
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

// Start the server if this file is run directly
if (require.main === module) {
  startServer();
}

module.exports = { startServer };
