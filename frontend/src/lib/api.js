/**
 * API client for 3D Lab Manager
 * Provides clean interfaces for all backend interactions
 */

const API_BASE = '/api';

/**
 * Generic fetch wrapper with error handling and MSW retry logic
 * @param {string} endpoint - API endpoint
 * @param {RequestInit} options - Fetch options
 * @param {number} retryCount - Number of retries for MSW initialization
 * @returns {Promise<any>} API response data
 */
const apiRequest = async (endpoint, options = {}, retryCount = 0) => {
  const url = `${API_BASE}${endpoint}`;

  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);

    // Check if we got HTML instead of JSON (MSW not ready)
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('text/html') && retryCount < 3) {
      // Wait a bit and retry
      await new Promise(resolve => setTimeout(resolve, 300));
      return apiRequest(endpoint, options, retryCount + 1);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'An error occurred');
    }

    return data.data;
  } catch (error) {
    // If JSON parsing failed due to HTML response and we haven't retried much, try again
    if (error.message.includes('Unexpected token') && retryCount < 3) {
      await new Promise(resolve => setTimeout(resolve, 300));
      return apiRequest(endpoint, options, retryCount + 1);
    }

    // Log error for debugging (in production, use proper logging service)
    console.error('API Request Error:', {
      url,
      error: error.message,
      options,
      retryCount
    });

    throw error;
  }
};

/**
 * Items API
 */
export const itemsApi = {
  /**
   * Get all items with optional filtering
   * @param {Object} filters - Search and filter parameters
   * @param {string} [filters.q] - Search query
   * @param {string} [filters.category] - Filter by category
   * @param {string} [filters.status] - Filter by status
   * @returns {Promise<Item[]>} Array of items
   */
  getItems: async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.q) params.append('q', filters.q);
    if (filters.category && filters.category !== 'all') params.append('category', filters.category);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);

    const queryString = params.toString();
    const endpoint = `/items${queryString ? `?${queryString}` : ''}`;

    return apiRequest(endpoint);
  },

  /**
   * Get a single item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Item>} Item details
   */
  getItem: async (id) => {
    return apiRequest(`/items/${id}`);
  },
};

/**
 * Issues API
 */
export const issuesApi = {
  /**
   * Submit an issue report
   * @param {Object} issue - Issue details
   * @param {string} issue.itemId - ID of the item
   * @param {string} issue.type - Type of issue
   * @param {string} issue.notes - Additional notes
   * @returns {Promise<Object>} Created issue data
   */
  submitIssue: async (issue) => {
    return apiRequest('/issues', {
      method: 'POST',
      body: JSON.stringify(issue),
    });
  },
};