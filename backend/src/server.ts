import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

let server: any = null;

// Under Vercel Serverless, Vercel invokes the exported Express app directly.
// Only spawn HTTP port listener when running in standalone mode (local dev, test, or standalone Node container).
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  server = app.listen(env.PORT, () => {
    logger.info(`🚀 Task Tracker API Server running in ${env.NODE_ENV} mode`);
    logger.info(`📡 Listening on http://localhost:${env.PORT}`);
    logger.info(`🩺 Health check accessible at http://localhost:${env.PORT}/health`);
    logger.info(`✨ API endpoints mounted at http://localhost:${env.PORT}/api/v1`);
  });

  const handleGracefulShutdown = (signal: string) => {
    logger.info(`[Server] Received ${signal}. Shutting down gracefully...`);
    server?.close(() => {
      logger.info('[Server] HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('[Server] Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => handleGracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => handleGracefulShutdown('SIGINT'));
}

export { server, app };
export default app;
