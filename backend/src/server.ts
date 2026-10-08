import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`🚀 Task Tracker API Server running in ${env.NODE_ENV} mode`);
  logger.info(`📡 Listening on http://localhost:${env.PORT}`);
  logger.info(`🩺 Health check accessible at http://localhost:${env.PORT}/health`);
  logger.info(`✨ API endpoints mounted at http://localhost:${env.PORT}/api/v1`);
});

// Graceful Shutdown handling
const handleGracefulShutdown = (signal: string) => {
  logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
  server.close(() => {
    logger.info('[Server] HTTP server closed.');
    process.exit(0);
  });

  // Force shutdown after 10 seconds if hanging
  setTimeout(() => {
    logger.error('[Server] Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));

export default server;
