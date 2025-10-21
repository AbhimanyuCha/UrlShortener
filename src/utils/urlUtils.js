const crypto = require('crypto');

class UrlUtils {
  /**
   * Converts a number to base62 encoding
   * @param {number|BigInt} n - The number to convert
   * @returns {string} Base62 encoded string
   */
  static base62(n) {
    const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    let result = "";
    
    if (typeof n === 'number') n = BigInt(n);
    
    if (n === 0n) return chars[0];
    
    const base = 62n;

    while (n > 0n) {
      result = chars[Number(n % base)] + result;
      n = n / base;
    }
    
    return result;
  }

  /**
   * Validates and normalizes a URL
   * @param {string} url - The URL to validate and normalize
   * @returns {string} Normalized URL
   * @throws {Error} If URL is invalid
   */
  static validateAndNormalizeUrl(url) {
    if (!url || typeof url !== 'string') {
      throw new Error('URL is required and must be a string');
    }

    // Remove whitespace
    url = url.trim();

    // Add protocol if missing
    if (!url.match(/^https?:\/\//i)) {
      url = `http://${url}`;
    }

    // Basic URL validation
    try {
      new URL(url);
      return url;
    } catch (error) {
      throw new Error('Invalid URL format');
    }
  }

  /**
   * Generates a short URL from a long URL using SHA256 hash
   * @param {string} longUrl - The long URL to shorten
   * @returns {string} Generated short URL
   */
  static generateShortUrl(longUrl) {
    const hash = crypto.createHash('sha256').update(longUrl).digest();
    let num = 0n;
    
    // Use first 6 bytes of hash
    for (let i = 0; i < 6; i++) {
      num = (num << 8n) | BigInt(hash[i]);
    }
    
    return this.base62(num).padStart(6, '0');
  }
}

module.exports = UrlUtils;
