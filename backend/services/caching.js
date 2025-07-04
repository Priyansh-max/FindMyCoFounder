const Redis = require("ioredis");

// For Render deployment - properly parse the Redis URL or use fallback configuration
let redisClient;

if (process.env.REDIS_URL) {
  // Initialize with the full connection URL from Render with proper configuration
  redisClient = new Redis(process.env.REDIS_URL, {
    // Connection resilience settings
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: false, // Connect immediately
    keepAlive: 30000,
    connectTimeout: 10000,
    commandTimeout: 5000,
    // TLS configuration for Upstash
    tls: {
      rejectUnauthorized: false // Allow self-signed certificates
    },
    // Retry strategy
    retryStrategy: (times) => {
      const delay = Math.min(times * 50, 2000);
      console.log(`Redis retry attempt ${times}, delay: ${delay}ms`);
      return delay;
    },
    // Connection pool settings
    family: 4,
    db: 0,
  });
  console.log("Connecting to Redis using connection URL with resilience config");
} else {
  // Fallback to traditional host/port configuration (for local development)
  redisClient = new Redis({
    host: process.env.REDIS_HOST || "localhost",
    port: process.env.REDIS_PORT || 6379,
    // Local development - less strict settings
    retryDelayOnFailover: 100,
    enableReadyCheck: false,
    maxRetriesPerRequest: 3,
    lazyConnect: false, // Connect immediately
  });
  console.log(`Connecting to Redis at ${process.env.REDIS_HOST || "localhost"}:${process.env.REDIS_PORT || 6379}`);
}

// Assign the client for compatibility with the rest of the code
const client = redisClient;

// Enhanced event handlers
client.on("connect", () => console.log("✅ Connected to Redis"));
client.on("ready", () => console.log("✅ Redis is ready"));
client.on("error", (err) => {
  console.error("❌ Redis error:", err.message);
  // Don't log full stack trace in production to avoid log spam
  if (process.env.NODE_ENV === 'development') {
    console.error(err.stack);
  }
});
client.on("close", () => console.log("🔌 Redis connection closed"));
client.on("reconnecting", () => console.log("🔄 Redis reconnecting..."));
client.on("end", () => console.log("🔚 Redis connection ended"));

// Force connection to establish immediately
console.log(`Initial Redis status: ${client.status}`);
if (client.status === 'wait') {
  console.log("🔄 Establishing Redis connection...");
  client.connect().catch(err => {
    console.error("❌ Failed to connect to Redis:", err.message);
  });
}

// Helper function to get cached data with connection check
const getCachedData = async (key) => {
  try {
    // Check if Redis is available
    if (client.status !== 'ready') {
      console.log(`Redis not ready (status: ${client.status}), skipping cache read`);
      return null;
    }
    
    const data = await client.get(key);
    if (!data) return null;
    
    const parsedData = JSON.parse(data);
    // Check if we have the new format with metadata
    if (parsedData.metadata && parsedData.data) {
      return {
        data: parsedData.data,
        metadata: parsedData.metadata,
        fromCache : true
      };
    } 
    // For backward compatibility, return old format data
    return {
      data: parsedData,
      metadata: {
        timestamp: new Date().toISOString() // Default to current time for old cache entries
      }
    };
  } catch (error) {
    console.error('Error getting cached data:', error.message);
    return null;
  }
};

// Helper function to set cached data with expiration and connection check
const setCachedData = async (key, data, expirationInSeconds = 3600) => {
  try {
    // Check if Redis is available
    if (client.status !== 'ready') {
      console.log(`Redis not ready (status: ${client.status}), skipping cache write`);
      return false;
    }
    
    // Store data with metadata
    const dataWithMetadata = {
      data: data,
      metadata: {
        timestamp: new Date().toISOString(), // When the data was fetched
        expiresAt: new Date(Date.now() + expirationInSeconds * 1000).toISOString()
      }
    };
    
    await client.setex(key, expirationInSeconds, JSON.stringify(dataWithMetadata));
    return true;
  } catch (error) {
    console.error('Error setting cached data:', error.message);
    return false;
  }
};

// Helper function to check if cache exists with connection check
const hasCache = async (key) => {
  try {
    // Check if Redis is available
    if (client.status !== 'ready') {
      console.log(`Redis not ready (status: ${client.status}), skipping cache check`);
      return false;
    }
    
    return await client.exists(key);
  } catch (error) {
    console.error('Error checking cache:', error.message);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down Redis connection...');
  await client.quit();
  process.exit(0);
});

module.exports = {
  client,
  getCachedData,
  setCachedData,
  hasCache
};
