const UrlUtils = require('../utils/urlUtils');
const config = require('../config');

class UrlService {
  constructor(dbConnection, redisClient, bloomFilterService) {
    this.db = dbConnection;
    this.redis = redisClient;
    this.bloomFilter = bloomFilterService;
  }

  /**
   * Creates a new short URL
   * @param {string} longUrl - The long URL to shorten
   * @returns {Promise<{short_url: string}>} The generated short URL
   * @throws {Error} If URL is invalid or creation fails
   */
  async createShortUrl(longUrl) {
    try {
      // Validate and normalize the URL
      const normalizedUrl = UrlUtils.validateAndNormalizeUrl(longUrl);
      
      // Generate short URL
      const shortUrl = UrlUtils.generateShortUrl(normalizedUrl);

      // Insert into database (with conflict handling)
      await this.db.query(
        "INSERT INTO urls (short_url, long_url) VALUES ($1, $2) ON CONFLICT (short_url) DO NOTHING",
        [shortUrl, normalizedUrl]
      );

      // Add to bloom filter
      this.bloomFilter.add(shortUrl);

      // Cache in Redis
      await this.redis.set(shortUrl, normalizedUrl, { EX: config.cache.ttl });

      return { short_url: shortUrl };
    } catch (error) {
      console.error("Error creating short URL:", error.message);
      throw error;
    }
  }

  /**
   * Retrieves the long URL for a given short URL
   * @param {string} shortUrl - The short URL to resolve
   * @returns {Promise<string>} The long URL
   * @throws {Error} If short URL is not found
   */
  async getLongUrl(shortUrl) {
    try {

      // Check bloom filter first
      if (!this.bloomFilter.test(shortUrl)) {
        throw new Error('Short URL not found (Bloom Filter miss)');
      }

      // Try Redis cache first
      let longUrl = await this.redis.get(shortUrl);
      if (longUrl) {
        console.log(`Cache Hit: ${shortUrl}`);
        return longUrl;
      }

      // Fallback to database
      const result = await this.db.query(
        "SELECT long_url FROM urls WHERE short_url = $1",
        [shortUrl]
      );

      if (result.rows.length === 0) {
        throw new Error('Short URL not found');
      }

      longUrl = result.rows[0].long_url;
      
      // Cache the result
      await this.redis.set(shortUrl, longUrl, { EX: config.cache.ttl });
      
      return longUrl;
    } catch (error) {
      console.error("Error retrieving long URL:", error.message);
      throw error;
    }
  }

  /**
   * Gets statistics about the URL service
   * @returns {Promise<Object>} Service statistics
   */
  async getStats() {
    try {
      const urlCountResult = await this.db.query("SELECT COUNT(*) as count FROM urls");
      const bloomStats = this.bloomFilter.getStats();
      
      return {
        totalUrls: parseInt(urlCountResult.rows[0].count),
        bloomFilter: bloomStats,
        cache: {
          ttl: config.cache.ttl
        }
      };
    } catch (error) {
      console.error("Error getting stats:", error.message);
      throw error;
    }
  }
}

module.exports = UrlService;
