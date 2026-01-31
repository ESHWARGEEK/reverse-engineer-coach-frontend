/**
 * Navigation utility functions for hash-based routing
 */

/**
 * Enhanced navigation helper with comprehensive error handling
 */
export const navigate = (path: string, replace: boolean = false) => {
  try {
    if (replace) {
      window.location.replace(`#${path}`);
    } else {
      window.location.hash = path;
    }
  } catch (error) {
    console.error('Navigation failed:', error);
    throw new Error(`Failed to navigate to ${path}`);
  }
};

/**
 * Get current path from hash
 */
export const getCurrentPath = () => {
  try {
    return window.location.hash.slice(1) || '/';
  } catch (error) {
    console.error('Failed to get current path:', error);
    return '/';
  }
};

/**
 * Get search parameters from hash
 */
export const getSearchParams = () => {
  try {
    const hash = window.location.hash;
    const queryStart = hash.indexOf('?');
    if (queryStart === -1) return new URLSearchParams();
    
    return new URLSearchParams(hash.slice(queryStart + 1));
  } catch (error) {
    console.error('Failed to get search params:', error);
    return new URLSearchParams();
  }
};