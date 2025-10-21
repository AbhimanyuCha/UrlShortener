const express = require('express');
const router = express.Router();

class UrlRoutes {
  constructor(urlService) {
    this.urlService = urlService;
    this.setupRoutes();
  }

  setupRoutes() {
    // Create short URL
    router.post('/v1/urls', async (req, res) => {
      try {
        const { long_url } = req.body;
        
        if (!long_url) {
          return res.status(400).json({ error: 'Missing long_url' });
        }

        const result = await this.urlService.createShortUrl(long_url);
        res.json(result);
      } catch (error) {
        console.error("Error in POST /v1/urls:", error.message);
        
        if (error.message === 'URL is required and must be a string' || 
            error.message === 'Invalid URL format') {
          return res.status(400).json({ error: error.message });
        }
        
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    // Get long URL by short URL
    router.get('/v1/urls/:short_url', async (req, res) => {
      try {
        const { short_url } = req.params;
        const longUrl = await this.urlService.getLongUrl(short_url);
        
        res.redirect(302, longUrl);
      } catch (error) {
        console.error("Error in GET /v1/urls/:short_url:", error.message);
        
        if (error.message === 'Invalid short URL format' ||
            error.message === 'Short URL not found (Bloom Filter miss)' ||
            error.message === 'Short URL not found') {
          return res.status(404).json({ error: error.message });
        }
        
        if (!res.headersSent) {
          res.status(500).json({ error: 'Internal Server Error' });
        }
      }
    });

    // Health check endpoint
    router.post('/', (req, res) => {
      res.json({ message: "hello, the service is live" });
    });

    // Stats endpoint
    router.get('/v1/stats', async (req, res) => {
      try {
        const stats = await this.urlService.getStats();
        res.json(stats);
      } catch (error) {
        console.error("Error in GET /v1/stats:", error.message);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });
  }

  getRouter() {
    return router;
  }
}

module.exports = UrlRoutes;
