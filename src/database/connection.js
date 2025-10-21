const { Pool } = require('pg');
const config = require('../config');

class DatabaseConnection {
  constructor() {
    this.pool = null;
  }

  async connect() {
    try {
      this.pool = new Pool(config.database);
      
      // Test the connection
      const result = await this.pool.query("SELECT NOW();");
      console.log("✅ Connected to DB at:", result.rows[0].now);
      
      return this.pool;
    } catch (error) {
      console.error("❌ Database connection error:", error.message);
      throw error;
    }
  }

  async query(text, params) {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.pool.query(text, params);
  }

  async close() {
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }
}

// Create a singleton instance
const dbConnection = new DatabaseConnection();

module.exports = dbConnection;
