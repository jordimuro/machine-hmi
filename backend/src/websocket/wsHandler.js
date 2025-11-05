import { WebSocketServer } from 'ws';
import { verifyToken } from '../auth/authService.js';
import tagStore from '../stores/tagStore.js';
import alarmStore from '../stores/alarmStore.js';
import logger from '../config/logger.js';
import config from '../config/index.js';

/**
 * WebSocket handler for real-time updates
 */
class WSHandler {
  constructor() {
    this.wss = null;
    this.clients = new Set();
    this.heartbeatInterval = null;
  }

  /**
   * Initialize WebSocket server
   */
  init(server) {
    this.wss = new WebSocketServer({
      server,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Setup listeners for tag and alarm updates
    this.setupStoreListeners();

    // Start heartbeat
    this.startHeartbeat();

    logger.info('WebSocket server initialized on /ws');
  }

  /**
   * Handle new WebSocket connection
   */
  handleConnection(ws, req) {
    const clientId = Math.random().toString(36).substring(7);

    // Client info
    const client = {
      id: clientId,
      ws,
      authenticated: false,
      user: null,
      alive: true,
    };

    // Try to authenticate from query string
    const url = new URL(req.url, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) {
        client.authenticated = true;
        client.user = decoded;
        logger.info({ clientId, role: decoded.role }, 'WebSocket client authenticated via token');
      }
    }

    this.clients.add(client);
    logger.info({ clientId, authenticated: client.authenticated }, 'WebSocket client connected');

    // Send initial state
    if (client.authenticated) {
      this.sendInitialState(client);
    }

    // Handle messages from client
    ws.on('message', (message) => {
      this.handleMessage(client, message);
    });

    // Handle pong (heartbeat response)
    ws.on('pong', () => {
      client.alive = true;
    });

    // Handle disconnection
    ws.on('close', () => {
      this.clients.delete(client);
      logger.info({ clientId }, 'WebSocket client disconnected');
    });

    // Handle errors
    ws.on('error', (error) => {
      logger.error({ err: error, clientId }, 'WebSocket error');
    });
  }

  /**
   * Handle message from client
   */
  handleMessage(client, message) {
    try {
      const data = JSON.parse(message.toString());

      switch (data.type) {
        case 'auth':
          // Authenticate with token
          if (data.token) {
            const decoded = verifyToken(data.token);
            if (decoded) {
              client.authenticated = true;
              client.user = decoded;
              logger.info({ clientId: client.id, role: decoded.role }, 'WebSocket client authenticated');

              // Send initial state after authentication
              this.sendInitialState(client);

              // Send auth success
              this.sendToClient(client, {
                type: 'auth_success',
                payload: { role: decoded.role },
              });
            } else {
              this.sendToClient(client, {
                type: 'auth_error',
                payload: { error: 'Invalid token' },
              });
            }
          }
          break;

        case 'ping':
          // Respond to ping
          this.sendToClient(client, { type: 'pong' });
          break;

        case 'subscribe':
          // Client can subscribe to specific tags (future enhancement)
          logger.debug({ clientId: client.id, data }, 'Subscribe message received');
          break;

        default:
          logger.warn({ clientId: client.id, type: data.type }, 'Unknown message type');
      }
    } catch (error) {
      logger.error({ err: error, clientId: client.id }, 'Failed to parse WebSocket message');
    }
  }

  /**
   * Send initial state to newly connected/authenticated client
   */
  sendInitialState(client) {
    // Send all current tags
    const tags = tagStore.getAll();
    tags.forEach(tag => {
      this.sendToClient(client, {
        type: 'tag_update',
        payload: tag,
      });
    });

    // Send all active alarms
    const alarms = alarmStore.getActiveAlarms();
    alarms.forEach(alarm => {
      this.sendToClient(client, {
        type: 'alarm_update',
        payload: alarm,
      });
    });

    // Send OPC UA status (import dynamically to avoid circular dependency)
    try {
      import('../opcua/opcuaClient.js').then(({ default: opcuaClient }) => {
        const opcuaStatus = opcuaClient.getStatus();
        this.sendToClient(client, {
          type: 'opcua_status',
          payload: opcuaStatus,
        });
      }).catch(() => {
        // Ignore import errors
      });
    } catch (error) {
      // Ignore errors
    }

    logger.debug({ clientId: client.id, tagsCount: tags.length, alarmsCount: alarms.length }, 'Initial state sent');
  }

  /**
   * Broadcast OPC UA status update to all authenticated clients
   */
  broadcastOpcuaStatus(status) {
    this.broadcast({
      type: 'opcua_status',
      payload: status,
    });
  }

  /**
   * Setup listeners for store updates
   */
  setupStoreListeners() {
    // Listen to tag updates
    tagStore.addListener((tagValue) => {
      this.broadcast({
        type: 'tag_update',
        payload: tagValue,
      });
    });

    // Listen to alarm updates
    alarmStore.addListener((alarmEntry) => {
      this.broadcast({
        type: 'alarm_update',
        payload: alarmEntry,
      });
    });

    logger.info('Store listeners setup for WebSocket broadcasting');
  }

  /**
   * Broadcast message to all authenticated clients
   */
  broadcast(message) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;

    this.clients.forEach(client => {
      if (client.authenticated && client.ws.readyState === 1) { // 1 = OPEN
        try {
          client.ws.send(messageStr);
          sentCount++;
        } catch (error) {
          logger.error({ err: error, clientId: client.id }, 'Failed to send message to client');
        }
      }
    });

    if (sentCount > 0) {
      logger.debug({ type: message.type, clientCount: sentCount }, 'Message broadcasted');
    }
  }

  /**
   * Send message to specific client
   */
  sendToClient(client, message) {
    if (client.ws.readyState === 1) { // 1 = OPEN
      try {
        client.ws.send(JSON.stringify(message));
      } catch (error) {
        logger.error({ err: error, clientId: client.id }, 'Failed to send message to client');
      }
    }
  }

  /**
   * Start heartbeat to detect disconnected clients
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach(client => {
        if (!client.alive) {
          logger.info({ clientId: client.id }, 'Client failed heartbeat, terminating');
          client.ws.terminate();
          this.clients.delete(client);
          return;
        }

        client.alive = false;
        client.ws.ping();
      });
    }, config.websocket.heartbeatIntervalMs);

    logger.info({ intervalMs: config.websocket.heartbeatIntervalMs }, 'WebSocket heartbeat started');
  }

  /**
   * Stop heartbeat
   */
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Close all connections
   */
  close() {
    this.stopHeartbeat();

    this.clients.forEach(client => {
      client.ws.close();
    });

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
    }

    logger.info('WebSocket server closed');
  }

  /**
   * Get connected clients count
   */
  getClientsCount() {
    return this.clients.size;
  }

  /**
   * Get authenticated clients count
   */
  getAuthenticatedClientsCount() {
    return Array.from(this.clients).filter(c => c.authenticated).length;
  }
}

// Singleton instance
const wsHandler = new WSHandler();

export default wsHandler;
