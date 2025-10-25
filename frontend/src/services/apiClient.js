/**
 * API Client for HMI Backend
 */

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

class ApiClient {
  constructor() {
    this.token = localStorage.getItem('hmi_token');
  }

  /**
   * Get authorization headers
   */
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  /**
   * Make API request
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  /**
   * Set authentication token
   */
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('hmi_token', token);
    } else {
      localStorage.removeItem('hmi_token');
    }
  }

  /**
   * Clear authentication token
   */
  clearToken() {
    this.setToken(null);
  }

  // Auth endpoints

  async login(pin) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
    this.setToken(data.token);
    return data;
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // Tags endpoints

  async getTags() {
    return this.request('/tags');
  }

  async getTag(name) {
    return this.request(`/tags/${encodeURIComponent(name)}`);
  }

  // Alarms endpoints

  async getAlarms() {
    return this.request('/alarms');
  }

  async getAllAlarms() {
    return this.request('/alarms/all');
  }

  // History endpoints

  async getHistory(tag, from, to) {
    const params = new URLSearchParams({
      tag,
      from: from.toString(),
      to: to.toString(),
    });
    return this.request(`/history?${params}`);
  }

  async getAvailableHistoryTags() {
    return this.request('/history/tags');
  }

  // Commands endpoints

  async executeCommand(command, params = {}) {
    return this.request('/cmd', {
      method: 'POST',
      body: JSON.stringify({ command, params }),
    });
  }

  async getOpcuaStatus() {
    return this.request('/cmd/status');
  }

  // Health check

  async getHealth() {
    return this.request('/health');
  }
}

// Singleton instance
const apiClient = new ApiClient();

export default apiClient;
