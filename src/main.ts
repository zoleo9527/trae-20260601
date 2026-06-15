import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useStaticAssets(join(__dirname, '..', 'public'), {
    prefix: '/',
  });

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('广告喷绘店-安装派工与照片回传系统')
    .setDescription('喷绘订单管理、安装派工、照片回传验收、业务工作台 API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('认证', '登录、角色权限')
    .addTag('喷绘订单', '订单创建、状态流转、安装派工、照片回传')
    .addTag('业务工作台', '优先级视图、待办事项、卡住分析、最近变更、工作量')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(3000);
  console.log('服务已启动: http://localhost:3000');
  console.log('接口文档:   http://localhost:3000/api/docs');
}

bootstrap();
