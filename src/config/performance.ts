// Performance optimizations for frontend
export const PERFORMANCE_CONFIG = {
  // API request timeouts
  API_TIMEOUT: 30000,
  
  // Debounce delays
  SEARCH_DEBOUNCE: 300,
  INPUT_DEBOUNCE: 150,
  
  // Cache settings
  CACHE_TTL: 5 * 60 * 1000, // 5 minutes
  
  // Pagination
  DEFAULT_PAGE_SIZE: 20,
  MAX_PAGE_SIZE: 100,
  
  // Retry settings
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,
};