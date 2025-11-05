import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../.env') });

export const config = {
  opcua: {
    endpoint: process.env.OPCUA_ENDPOINT || 'opc.tcp://localhost:4840',
    pollingRateMs: parseInt(process.env.POLLING_RATE_MS || '500', 10),
  },
  logging: {
    logIntervalMs: parseInt(process.env.LOG_INTERVAL_MS || '5000', 10),
    level: process.env.LOG_LEVEL || 'info',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || 'change_me_in_production',
    pinOperator: process.env.PIN_OPERATOR || '1111',
    pinMaintenance: process.env.PIN_MAINTENANCE || '2222',
  },
  server: {
    port: parseInt(process.env.PORT || '8080', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
  },
  websocket: {
    heartbeatIntervalMs: parseInt(process.env.WS_HEARTBEAT_INTERVAL_MS || '30000', 10),
  },
  history: {
    retentionHours: parseInt(process.env.HISTORY_RETENTION_HOURS || '24', 10),
  },
};

export default config;
