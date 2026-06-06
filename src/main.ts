import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors();
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('校园维修-报修登记与派单响应系统')
    .setDescription('报修登记、派单响应、维修处理全流程管理API')
    .setVersion('1.0')
    .addTag('repair', '报修登记管理')
    .addTag('dispatch', '派单响应管理')
    .addTag('maintenance', '维修师傅工作台')
    .addTag('role-entrance', '角色工作台入口')
    .addTag('seed', '种子数据')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3002);
  console.log('Application is running on: http://localhost:3002');
  console.log('Frontend: http://localhost:3002/index.html');
  console.log('Swagger docs: http://localhost:3002/api');
}
bootstrap();
