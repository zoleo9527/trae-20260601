import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.setGlobalPrefix('api');
  const config = new DocumentBuilder()
    .setTitle('家政服务匹配系统')
    .setDescription('客户需求与阿姨匹配 - 状态流转与责任追踪')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log('[APP] running on http://localhost:' + port + '/api/docs');
}
bootstrap();
