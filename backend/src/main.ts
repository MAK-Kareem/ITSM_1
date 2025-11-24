import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // CORS
  app.enableCors({
    origin: '*',
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // API Documentation
  const config = new DocumentBuilder()
    .setTitle('EazyPay ITSM API')
    .setDescription('IT Service Management System API Documentation')
    .setVersion('1.0.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
    customSiteTitle: 'EazyPay ITSM API Docs',
  });

  // Start server
  const port = configService.get('PORT') || 3000;
  const host = configService.get('HOST') || '0.0.0.0';
  await app.listen(port, host);
  console.log(`Application is running on: http://${host}:${port}`);
  console.log(`Swagger documentation: http://172.21.1.48:${port}/api`);
}
bootstrap();
