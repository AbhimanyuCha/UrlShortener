# URL Shortener Service

A high-performance URL shortener service built with Node.js, Express, PostgreSQL, Redis, and Bloom Filter for efficient URL lookups.

## Architecture

The service has been refactored into a modular architecture for better maintainability and scalability:

```
src/
├── config/            # Configuration management
│   └── index.js       # Environment variables and constants
├── database/          # Database layer
│   └── connection.js  # PostgreSQL connection pool
├── cache/             # Caching layer
│   └── redisClient.js # Redis client management
├── services/          # Business logic services
│   ├── bloomFilter.js # Bloom filter service
│   └── urlService.js  # URL shortening business logic
├── routes/            # API routes
│   └── urlRoutes.js   # URL-related endpoints
├── middleware/        # Express middleware
│   └── index.js       # CORS, logging, error handling, rate limiting
├── utils/             # Utility functions
│   └── urlUtils.js    # URL validation, base62 encoding
├── server.js          # Server setup and initialization
└── index.js           # Application entry point
```

## Features

- **High Performance**: Uses Bloom Filter for fast URL existence checks
- **Caching**: Redis caching for frequently accessed URLs
- **Database**: PostgreSQL for persistent storage
- **Rate Limiting**: Built-in rate limiting to prevent abuse
- **Error Handling**: Comprehensive error handling and logging
- **Modular Design**: Clean separation of concerns

## API Endpoints

### Create Short URL
```http
POST /v1/urls
Content-Type: application/json

{
  "long_url": "https://example.com"
}
```

### Redirect to Long URL
```http
GET /v1/urls/{short_url}
```

### Health Check
```http
POST /
```

### Statistics
```http
GET /v1/stats
```

## Environment Variables

```bash
# Server
PORT=8080

# Database
DB_HOST=localhost
DB_PORT=5462
DB_USER=postgres
DB_NAME=postgres
DB_PASSWORD=postgres

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# CORS
CORS_ORIGIN=*
```

## Getting Started

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the service:**
   ```bash
   npm run dev
   ```

## Docker Support

The service includes Docker configuration for easy deployment:

```bash
docker-compose up --build
```

Cleanup
```bash
docker-compose down -v
```

## Key Improvements

### Modular Architecture
- **Separation of Concerns**: Each module has a single responsibility
- **Dependency Injection**: Services are injected rather than tightly coupled
- **Testability**: Each module can be tested independently
- **Maintainability**: Changes to one module don't affect others

### Error Handling
- **Centralized Error Handling**: All errors are handled consistently
- **Proper HTTP Status Codes**: Appropriate status codes for different error types
- **Logging**: Comprehensive logging for debugging

### Performance Optimizations
- **Bloom Filter**: Fast existence checks before database queries
- **Redis Caching**: Reduces database load for frequently accessed URLs
- **Connection Pooling**: Efficient database connection management

### Security
- **Rate Limiting**: Prevents abuse and DoS attacks
- **Input Validation**: Proper validation of URLs and parameters
- **CORS Configuration**: Configurable CORS settings

## Development

The modular structure makes it easy to:

- Add new features without affecting existing code
- Write unit tests for individual modules
- Scale specific components independently
- Debug issues more effectively

## Monitoring

The service includes:
- Request logging with timestamps
- Error tracking and reporting
- Statistics endpoint for monitoring
- Graceful shutdown handling
