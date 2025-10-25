import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import config from './config/index.js';
import logger from './config/logger.js';
import opcuaClient from './opcua/opcuaClient.js';
import historyStore from './stores/historyStore.js';
import wsHandler from './websocket/wsHandler.js';

// Import routes
import authRoutes from './routes/auth.js';
import tagsRoutes from './routes/tags.js';
import alarmsRoutes from './routes/alarms.js';
import historyRoutes from './routes/history.js';
import commandsRoutes from './routes/commands.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  logger.info({ method: req.method, url: req.url, ip: req.ip }, 'HTTP request');
  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tags', tagsRoutes);
app.use('/api/alarms', alarmsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/cmd', commandsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const status = opcuaClient.getStatus();
  res.json({
    status: 'ok',
    timestamp: Date.now(),
    opcua: status,
    websocket: {
      clients: wsHandler.getClientsCount(),
      authenticated: wsHandler.getAuthenticatedClientsCount(),
    },
  });
});

// Serve frontend static files in production
if (config.server.nodeEnv === 'production') {
  const frontendPath = join(__dirname, '../../frontend/dist');
  app.use(express.static(frontendPath));

  // Catch-all route to serve index.html for SPA routing
  app.get('*', (req, res) => {
    if (!req.url.startsWith('/api') && !req.url.startsWith('/ws')) {
      res.sendFile(join(frontendPath, 'index.html'));
    } else {
      res.status(404).json({ error: 'Not found' });
    }
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error({ err, url: req.url }, 'Unhandled error');
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

/**
 * Initialize application
 */
async function initialize() {
  try {
    logger.info({ nodeEnv: config.server.nodeEnv }, 'Initializing Machine HMI Backend');

    // Initialize history database
    historyStore.init();

    // Initialize OPC UA client
    await opcuaClient.init();

    logger.info('Application initialized successfully');
  } catch (error) {
    logger.error({ err: error }, 'Failed to initialize application');
    throw error;
  }
}

/**
 * Start server
 */
async function start() {
  try {
    await initialize();

    const server = app.listen(config.server.port, () => {
      logger.info({ port: config.server.port }, 'HTTP server listening');
    });

    // Initialize WebSocket server
    wsHandler.init(server);

    return server;
  } catch (error) {
    logger.error({ err: error }, 'Failed to start server');
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown(server) {
  logger.info('Shutting down gracefully...');

  try {
    // Close WebSocket server
    wsHandler.close();

    // Disconnect OPC UA client
    await opcuaClient.disconnect();

    // Close history database
    historyStore.close();

    // Close HTTP server
    if (server) {
      server.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Exit process
    setTimeout(() => {
      logger.info('Shutdown complete');
      process.exit(0);
    }, 1000);
  } catch (error) {
    logger.error({ err: error }, 'Error during shutdown');
    process.exit(1);
  }
}

// Start server
const server = await start();

// Handle shutdown signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  shutdown(server);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received');
  shutdown(server);
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  shutdown(server);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  shutdown(server);
});

export default app;
