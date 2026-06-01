import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { IdempotencyMiddleware } from './common/middleware/idempotency.middleware';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new AuditLogInterceptor());

  const idempotencyMiddleware = new IdempotencyMiddleware();
  app.use((req, res, next) => idempotencyMiddleware.use(req, res, next));

  const config = new DocumentBuilder()
    .setTitle('药房运营协同服务 API')
    .setDescription('处方复核、近效药预警、下架确认、调拨审批统一协同平台')
    .setVersion('1.0.0')
    .addApiKey({ type: 'apiKey', name: 'X-Request-Id', in: 'header' }, 'X-Request-Id')
    .addApiKey({ type: 'apiKey', name: 'X-User-Id', in: 'header' }, 'X-User-Id')
    .addApiKey({ type: 'apiKey', name: 'X-User-Role', in: 'header' }, 'X-User-Role')
    .addApiKey({ type: 'apiKey', name: 'X-Store-Id', in: 'header' }, 'X-Store-Id')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 药房运营协同服务已启动: http://localhost:${port}`);
  console.log(`📖 API 文档: http://localhost:${port}/api/docs`);
}

bootstrap();
