import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.use(helmet());

  app.enableCors({
    origin: 'http://localhost:5173',
    credentials: true,
  });

  app.use(
    '/api/v1/auth/login',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 5,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Demasiados intentos de login. Intenta nuevamente en 1 minuto.',
        error: 'Too Many Requests',
      },
    }),
  );

  app.use(
    '/api/v1/transfers',
    rateLimit({
      windowMs: 60 * 1000,
      limit: 10,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        statusCode: 429,
        message: 'Demasiadas solicitudes de transferencia. Intenta nuevamente en 1 minuto.',
        error: 'Too Many Requests',
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();