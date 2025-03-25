const redis = require('ioredis');

const client = new redis();

// Helper function to get cached data
const getCachedData = async (key) => {
  try {
    const data = await client.get(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error getting cached data:', error);
    return null;
  }
};

// Helper function to set cached data with expiration
const setCachedData = async (key, data, expirationInSeconds = 3600) => {
  try {
    await client.setex(key, expirationInSeconds, JSON.stringify(data));
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
