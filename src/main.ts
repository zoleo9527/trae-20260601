import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    })
  );

  const config = new DocumentBuilder()
    .setTitle('学校食堂-学生订餐与特殊餐标记系统')
    .setDescription('学校食堂订餐、特殊餐标记、采购、留样全流程管理API')
    .setVersion('1.0')
    .addTag('student-meal', '学生订餐管理')
    .addTag('special-meal', '特殊餐标记管理')
    .addTag('purchase', '采购单与订餐汇总')
    .addTag('sample', '留样记录管理')
    .addTag('timeline', '操作时间线')
    .addTag('role-entrance', '角色工作台入口')
    .addTag('seed', '种子数据')
    .addTag('notification', '系统通知')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3002);
  console.log('Application is running on: http://localhost:3002');
  console.log('Swagger docs: http://localhost:3002/api');
}
bootstrap();
