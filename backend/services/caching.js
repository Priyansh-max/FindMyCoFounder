const Redis = require("ioredis");

const client = new Redis({
  host: process.env.REDIS_HOST || "localhost",  
  port: process.env.REDIS_PORT || 6379
});

client.on("connect", () => console.log("✅ Connected to Redis"));
client.on("error", (err) => console.error("❌ Redis error:", err));
// Helper function to get cached data
const getCachedData = async (key) => {
  try {
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
    console.error('Error getting cached data:', error);
    return null;
  }
};

// Helper function to set cached data with expiration
const setCachedData = async (key, data, expirationInSeconds = 3600) => {
  try {
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
    console.error('Error setting cached data:', error);
    return false;
  }
};

// Helper function to check if cache exists
const hasCache = async (key) => {
  try {
    return await client.exists(key);
  } catch (error) {
    console.error('Error checking cache:', error);
    return false;
  }
};

module.exports = {
  client,
  getCachedData,
  setCachedData,
  hasCache
};
