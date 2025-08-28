class ApiKeyRotator {
  constructor() {
    this.keys = [
      process.env.API_KEY,
      process.env.API_KEY1,
      process.env.API_KEY2,
      process.env.API_KEY3
    ].filter(key => key); // Remove undefined keys
    
    this.currentIndex = 0;
    this.rateLimitedKeys = new Set();
    this.resetTimers = new Map();
  }

  getCurrentKey() {
    if (this.keys.length === 0) {
      throw new Error('No API keys available');
    }
    
    // Find next available key
    let attempts = 0;
    while (attempts < this.keys.length) {
      const key = this.keys[this.currentIndex];
      if (!this.rateLimitedKeys.has(key)) {
        return key;
      }
      this.currentIndex = (this.currentIndex + 1) % this.keys.length;
      attempts++;
    }
    
    throw new Error('All API keys are rate limited');
  }

  markAsRateLimited(key) {
    this.rateLimitedKeys.add(key);
    
    // Reset after 1 hour (3600000 ms)
    if (this.resetTimers.has(key)) {
      clearTimeout(this.resetTimers.get(key));
    }
    
    const timer = setTimeout(() => {
      this.rateLimitedKeys.delete(key);
      this.resetTimers.delete(key);
      console.log(`API key reset: ${key.substring(0, 8)}...`);
    }, 3600000);
    
    this.resetTimers.set(key, timer);
    
    // Move to next key
    this.currentIndex = (this.currentIndex + 1) % this.keys.length;
    console.log(`API key rate limited: ${key.substring(0, 8)}...`);
  }

  getAvailableKeysCount() {
    return this.keys.length - this.rateLimitedKeys.size;
  }
}

export default new ApiKeyRotator();