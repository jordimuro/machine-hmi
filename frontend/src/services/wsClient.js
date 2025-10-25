/**
 * WebSocket Client for real-time updates
 */

const WS_URL = import.meta.env.VITE_WS_URL ||
  (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
  window.location.host + '/ws';

class WSClient {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;
    this.listeners = {
      tag_update: new Set(),
      alarm_update: new Set(),
      connected: new Set(),
      disconnected: new Set(),
      error: new Set(),
    };
    this.reconnectTimer = null;
    this.pingInterval = null;
  }

  /**
   * Connect to WebSocket server
   */
  connect(token) {
    if (this.ws && this.connected) {
      console.warn('WebSocket already connected');
      return;
    }

    const url = token ? `${WS_URL}?token=${token}` : WS_URL;

    try {
      console.log('Connecting to WebSocket...', WS_URL);
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connected = true;
        this.reconnectAttempts = 0;

        // If token wasn't in URL, send it via message
        if (!token && localStorage.getItem('hmi_token')) {
          this.send({
            type: 'auth',
            token: localStorage.getItem('hmi_token'),
          });
        }

        // Start ping interval
        this.startPing();

        // Notify listeners
        this.notifyListeners('connected', { connected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error', error);
        this.notifyListeners('error', error);
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connected = false;
        this.stopPing();

        // Notify listeners
        this.notifyListeners('disconnected', { connected: false });

        // Attempt reconnect with exponential backoff
        this.scheduleReconnect(token);
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection', error);
      this.scheduleReconnect(token);
    }
  }

  /**
   * Handle incoming message
   */
  handleMessage(message) {
    const { type, payload } = message;

    switch (type) {
      case 'tag_update':
        this.notifyListeners('tag_update', payload);
        break;

      case 'alarm_update':
        this.notifyListeners('alarm_update', payload);
        break;

      case 'pong':
        // Heartbeat response
        break;

      case 'auth_success':
        console.log('WebSocket authenticated', payload);
        break;

      case 'auth_error':
        console.error('WebSocket authentication failed', payload);
        break;

      default:
        console.warn('Unknown message type', type);
    }
  }

  /**
   * Send message to server
   */
  send(message) {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }

  /**
   * Start ping interval
   */
  startPing() {
    this.stopPing();
    this.pingInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 25000); // Ping every 25 seconds
  }

  /**
   * Stop ping interval
   */
  stopPing() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Schedule reconnection with exponential backoff
   */
  scheduleReconnect(token) {
    if (this.reconnectTimer) {
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      this.maxReconnectDelay
    );

    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`);

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect(token);
    }, delay);
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopPing();

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connected = false;
  }

  /**
   * Add event listener
   */
  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].add(callback);
    } else {
      console.warn(`Unknown event type: ${event}`);
    }
  }

  /**
   * Remove event listener
   */
  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].delete(callback);
    }
  }

  /**
   * Notify all listeners for an event
   */
  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in ${event} listener`, error);
        }
      });
    }
  }

  /**
   * Get connection status
   */
  isConnected() {
    return this.connected;
  }
}

// Singleton instance
const wsClient = new WSClient();

export default wsClient;
