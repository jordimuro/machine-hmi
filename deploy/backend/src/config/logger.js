import pino from 'pino';
import config from './index.js';

const logger = pino({
  level: config.logging.level,
  transport: config.server.nodeEnv === 'development'
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname',
        },
      }
    : undefined,
});

export default logger;
