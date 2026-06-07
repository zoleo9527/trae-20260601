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
    console.log('  乳品配送站-订奶变更与路线调整系统');
    console.log('  服务地址: http://localhost:3000');
    console.log('========================================');
    console.log('');
    console.log('API 接口列表:');
    console.log('');
    console.log('【订奶变更管理】');
    console.log('  POST   /api/milk-changes                   - 创建订奶变更');
    console.log('  GET    /api/milk-changes/default           - 默认列表（今天要办+已拖延+刚退回）');
    console.log('  GET    /api/milk-changes/my-todo           - 我的待办（按角色）');
    console.log('  GET    /api/milk-changes                   - 查询订奶变更列表');
    console.log('  GET    /api/milk-changes/:id               - 获取订奶变更详情');
    console.log('  PUT    /api/milk-changes/:id/process       - 处理订奶变更（状态流转）');
    console.log('  PUT    /api/milk-changes/:id/assign-route  - 分配/调整路线');
    console.log('  GET    /api/milk-changes/:id/logs          - 获取操作日志');
    console.log('  GET    /api/milk-changes/:id/route-histories - 获取路线调整历史');
    console.log('  GET    /api/milk-changes/:id/review        - 订奶变更回看（详情+日志+路线历史）');
    console.log('');
  });
}
bootstrap();
