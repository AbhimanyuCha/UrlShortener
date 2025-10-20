const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const crypto = require('crypto');
const redis = require('redis'); // <-- Added Redis
const {BloomFilter} = require('bloomfilter'); // <-- Using bloomfilter library

const app = express();
const port = 8080;

// --- Configuration from Environment Variables ---
const DB_HOST = process.env.DB_HOST || "localhost";
const DB_PORT = process.env.DB_PORT || 5462;
const REDIS_HOST = process.env.REDIS_HOST || "localhost";
const REDIS_PORT = process.env.REDIS_PORT || 6379;

// --- Bloom Filter Setup ---
// Estimated number of elements (n) and false positive probability (p)
// This example assumes a maximum of 10,000 URLs with a 1% false positive rate.
const BLOOM_CAPACITY = 10000;
const BLOOM_FPR = 0.01;
let bloom;

// --- Redis Client Setup ---
const redisClient = redis.createClient({
  url: `redis://${REDIS_HOST}:${REDIS_PORT}`
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error', err));


// --- PostgreSQL connection ---
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: DB_HOST,
  database: process.env.DB_NAME || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  port: DB_PORT,  
  max: 32,
  connectionTimeoutMillis: 100,
  idleTimeoutMillis: 0
});

function base62(n) {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  let result = "";
  
  // Convert to BigInt if it's not already (for safety)
  if (typeof n === 'number') n = BigInt(n);
  
  if (n === 0n) return chars[0]; // BigInt literal 0n
  
  const base = 62n; // BigInt literal 62n

  // Use BigInt logic
  while (n > 0n) {
    result = chars[Number(n % base)] + result; // Modulo returns BigInt, convert to Number for array index
    n = n / base;                              // Division is safe with BigInt
  }
  
  return result;
}


// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cors());


// --- Startup and Initialization ---
(async () => {
  try {
    // 1. Test DB connection
    const result = await pool.query("SELECT NOW();");
    console.log("✅ Connected to DB at:", result.rows[0].now);

    // 2. Connect to Redis
    await redisClient.connect();
    console.log("✅ Connected to Redis at:", REDIS_HOST);

    // 3. Initialize Bloom Filter
    // For ~10k items and ~1% FPR, use around 96k bits and 7 hash functions
    bloom = new BloomFilter(96 * 1024, 7);
    
    // 4. Populate Bloom Filter from existing URLs (important for persistence)
    console.log("⏳ Populating Bloom Filter...");
    const urlsResult = await pool.query("SELECT short_url FROM urls");
    urlsResult.rows.forEach(row => {
        bloom.add(row.short_url);
    });
    console.log(`✅ Bloom Filter populated with ${urlsResult.rows.length} short URLs.`);

  } catch (err) {
    console.error("❌ Initialization error:", err.message);
  }
})();

// POST: Receive long URL and store in DB (Write-Through)
app.post("/v1/urls", async (req, res) => {
  try {
    let { long_url } = req.body;
    if (!long_url) return res.status(400).send("Missing long_url");

    // --- NEW FIX: Ensure URL is absolute ---
    if (!long_url.match(/^https?:\/\//i)) {
      // Assuming http is the safest default if protocol is missing
      long_url = `http://${long_url}`;
    }

    // Generate short url logic (as before)
    const hash = crypto.createHash('sha256').update(long_url).digest();
    let num = 0n;
    for (let i = 0; i < 6; i++) {
      num = (num << 8n) | BigInt(hash[i]);
    }
    let short_url = base62(num).padStart(6, '0');

    // 1. Write to DB
    await pool.query(
      "INSERT INTO urls (short_url, long_url) VALUES ($1, $2) ON CONFLICT (short_url) DO NOTHING",
      [short_url, long_url]
    );

    // 2. Add to Bloom Filter
    bloom.add(short_url);

    // 3. Write to Redis (Write-Through Cache)
    await redisClient.set(short_url, long_url, { EX: 3600 * 24 * 7 }); // Cache for 1 week

    res.json({ short_url });
  } catch (err) {
    console.error("Error inserting:", err.message);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/v1/urls/:short_url", async (req, res) => {
  try {
    const { short_url } = req.params;

    // 1. Check Bloom Filter (Fastest check)
    if (!bloom.test(short_url)) {
        // If the Bloom Filter says it's definitely NOT there, return 404 immediately.
        return res.status(404).send("Short URL not found (Bloom Filter miss)");
    }
    
    // 2. Check Redis Cache
    let longUrl = await redisClient.get(short_url);

    if (longUrl) {
      // Cache hit: Serve immediately
      console.log(`Cache Hit: ${short_url}`);
      return res.redirect(302, longUrl); // <-- CORRECT
    }

    // 3. Cache Miss: Query PostgreSQL DB
    const result = await pool.query(
      "SELECT long_url FROM urls WHERE short_url = $1",
      [short_url]
    );

    if (result.rows.length > 0) {
      longUrl = result.rows[0].long_url;
      
      // Update Cache (Cache-Aside Pattern)
      await redisClient.set(short_url, longUrl, { EX: 3600 * 24 * 7 });
      
      return res.redirect(302, longUrl); // <-- ADDED 'return'
    } else {
      // The short_url was a Bloom Filter false positive or was deleted/expired.
      return res.status(404).send("Short URL not found"); // <-- ADDED 'return'
    }
  } catch (err) {
    console.error("Error fetching:", err.message);
    // Check if headers have already been sent before sending a 500
    if (!res.headersSent) {
        return res.status(500).send("Internal Server Error"); // <-- ADDED 'return'
    }
    // If headers were sent, we just log the error and allow the connection to close naturally
    return;
  }
});

// Default route
app.post("/", (req, res) => {
  res.json({ message: "hello, the service is live" });
});

if (require.main === module) app.listen(port, () => console.log("🌻Server up"));