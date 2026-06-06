import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept',
  });

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
  }));

  await app.listen(3000, () => {
    console.log('');
    console.log('========================================');
    console.log('  学生宿舍管理系统后端已启动');
    console.log('  服务地址: http://localhost:3000');
    console.log('========================================');
    console.log('');
    console.log('API 接口列表:');
    console.log('');
    console.log('【入住分配】');
    console.log('  GET    /api/check-in              - 查询入住分配列表');
    console.log('  GET    /api/check-in/:id          - 获取入住分配详情');
    console.log('  POST   /api/check-in              - 创建入住分配');
    console.log('  POST   /api/check-in/:id/process  - 处理入住分配');
    console.log('  GET    /api/check-in/:id/logs     - 获取入住分配操作日志');
    console.log('');
    console.log('【床位调整】');
    console.log('  GET    /api/bed-adjustment              - 查询床位调整列表');
    console.log('  GET    /api/bed-adjustment/:id          - 获取床位调整详情');
    console.log('  POST   /api/bed-adjustment              - 创建床位调整');
    console.log('  POST   /api/bed-adjustment/:id/process  - 处理床位调整');
    console.log('  GET    /api/bed-adjustment/:id/logs     - 获取床位调整操作日志');
    console.log('  GET    /api/bed-adjustment/:id/review   - 床位调整回看（详情+日志）');
    console.log('');
  });
}

bootstrap();
