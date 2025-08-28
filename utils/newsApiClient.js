import axios from 'axios';
import apiKeyRotator from './apiKeyRotator.js';

export const makeNewsApiRequest = async (url, maxRetries = 4) => {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const apiKey = apiKeyRotator.getCurrentKey();
      const fullUrl = `${url}${url.includes('?') ? '&' : '?'}apikey=${apiKey}`;
      
      console.log(`Attempt ${attempt + 1}: Using API key ${apiKey.substring(0, 8)}...`);
      
      const response = await axios.get(fullUrl);
      return response;
      
    } catch (error) {
      lastError = error;
      
      if (error.response?.status === 429) {
        const currentKey = apiKeyRotator.getCurrentKey();
        apiKeyRotator.markAsRateLimited(currentKey);
        
        if (apiKeyRotator.getAvailableKeysCount() === 0) {
          throw new Error('All API keys are rate limited. Please try again later.');
        }
        
        console.log(`Rate limit hit, retrying with next key...`);
        continue;
      }
      
      // For non-429 errors, don't retry
      throw error;
    }
  }
  
  throw lastError;
};