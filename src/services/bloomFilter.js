const { BloomFilter } = require('bloomfilter');
const config = require('../config');

class BloomFilterService {
  constructor() {
    this.bloom = null;
  }

  initialize() {
    this.bloom = new BloomFilter(
      config.bloomFilter.bitArraySize, 
      config.bloomFilter.hashCount
    );
    console.log("✅ Bloom Filter initialized");
  }

  async populateFromDatabase(dbConnection) {
    if (!this.bloom) {
      throw new Error('Bloom filter not initialized. Call initialize() first.');
    }

    try {
      console.log("⏳ Populating Bloom Filter...");
      const urlsResult = await dbConnection.query("SELECT short_url FROM urls");
      
      urlsResult.rows.forEach(row => {
        this.bloom.add(row.short_url);
      });
      
      console.log(`✅ Bloom Filter populated with ${urlsResult.rows.length} short URLs.`);
    } catch (error) {
      console.error("❌ Error populating Bloom Filter:", error.message);
      throw error;
    }
  }

  add(shortUrl) {
    if (!this.bloom) {
      throw new Error('Bloom filter not initialized. Call initialize() first.');
    }
    this.bloom.add(shortUrl);
  }

  test(shortUrl) {
    if (!this.bloom) {
      throw new Error('Bloom filter not initialized. Call initialize() first.');
    }
    return this.bloom.test(shortUrl);
  }

  getStats() {
    if (!this.bloom) {
      return null;
    }
    return {
      bitArraySize: this.bloom.bitArraySize,
      hashCount: this.bloom.hashCount,
      capacity: config.bloomFilter.capacity,
      falsePositiveRate: config.bloomFilter.falsePositiveRate
    };
  }
}

// Create a singleton instance
const bloomFilterService = new BloomFilterService();

module.exports = bloomFilterService;
