import { env } from './config/env';
import app from './app';
import { logger } from './config/logger';
import { initSocketServer } from './sockets/socketServer';

const startServer = async () => {
  try {
    const server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server running in ${env.NODE_ENV} mode on port ${env.PORT}`);
      logger.info(`📚 Swagger docs available at http://localhost:${env.PORT}/api/v1/docs`);
    });

    // Initialize Socket.io
    initSocketServer(server);
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to start server:');
    process.exit(1);
  }
};

startServer();
