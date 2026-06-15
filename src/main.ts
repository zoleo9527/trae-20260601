import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
    .setTitle('手机维修店接机登记系统')
    .setDescription('接机登记、隐私授权、维修流程管理 API')
    .setVersion('1.0.0')
    .addBearerAuth()
    .addTag('认证', '登录、角色权限')
    .addTag('接机登记', '前台接机、工单创建')
    .addTag('隐私授权', '授权签署、回看记录')
    .addTag('维修工单', '维修师处理工单')
    .addTag('仪表盘', '优先级视图、进度概览')
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
