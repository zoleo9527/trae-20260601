import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
  }));

  const config = new DocumentBuilder()
    .setTitle('MCN达人签约与档案维护系统')
    .setDescription('MCN机构达人签约流程与档案维护API')
    .setVersion('1.0')
    .addTag('talent', '达人管理')
    .addTag('contract', '签约流程')
    .addTag('archive', '档案维护')
    .addTag('seed', '种子数据')
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(3000);
  console.log('Application is running on: http://localhost:3000');
  console.log('Swagger docs: http://localhost:3000/api');
}
bootstrap();
