import 'reflect-metadata';
import app from './app';
import { AppDataSource } from './config/dataSource';
import { env } from './config/env';
import { logger } from './config/logger';

async function bootstrap() {
  await AppDataSource.initialize();
  logger.info('Database connected');

  const server = app.listen(env.PORT, () => {
    logger.info(`Server running on port ${env.PORT}`);
  });

  const shutdown = () => {
    logger.info('Shutting down gracefully...');
    server.close(async () => {
      await AppDataSource.destroy();
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

bootstrap().catch((err) => {
  logger.error(err, 'Failed to start server');
  process.exit(1);
});
