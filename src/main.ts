import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as cookieParser from 'cookie-parser';
import { ServerOptions } from 'socket.io';
import { SocketAuthMiddleware } from './middlewares/auth.middleware';
import { join } from 'path';
import * as express from 'express';

class CustomIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions) {
    const server = super.createIOServer(port, options);

    server.use((socket, next) => new SocketAuthMiddleware().use(socket, next));

    return server;
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(cookieParser());
  app.useWebSocketAdapter(new CustomIoAdapter(app));
  app.use(express.urlencoded({ extended: true, limit: '2mb' }));
  app.use('/uploads', express.static(join(__dirname, '..', 'uploads')));

  app.enableCors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  });

  const port = parseInt(process.env.PORT || '3001', 10);

  await app.listen(port, '0.0.0.0');
}

bootstrap();
