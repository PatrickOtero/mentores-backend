import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';
import { json } from 'express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigins = process.env.CORS_ORIGINS?.split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  app.enableCors({
<<<<<<< HEAD
    origin: corsOrigins?.length ? corsOrigins : process.env.FRONTEND_URL,
=======
    origin: [
    process.env.REMOTE_FRONTEND_DEV_URL,
    process.env.LOCAL_FRONTEND_URL,
  ],
>>>>>>> 28480ca19788fb0218e7e5c6c6ff6e44aea448f7
    credentials: true,
  });

  app.use(json({ limit: '10mb' }));

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Mentores-Backend')
    .setDescription('Documentação das rotas da API Mentores Backend.')
    .setVersion('1.1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.PORT);

  console.info('Server started on port ' + process.env.PORT);
}
bootstrap();
