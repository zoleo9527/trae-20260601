import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { GlobalExceptionFilter } from './filters/exception.filter';
import { TransformInterceptor } from './interceptors/transform.interceptor';
import { UserRole, UserContext } from './common/role';

declare global {
  namespace Express {
    interface Request {
      user?: UserContext;
    }
  }
}

const mockUsers: Record<string, UserContext> = {
  'clerk-token-001': {
    id: 'clerk-001',
    name: '张店员',
    role: UserRole.CLERK,
    storeId: 'store-001',
    permissions: [
      'member:create',
      'member:read',
      'member:update',
      'baby:create',
      'baby:read',
      'baby:update',
      'reminder:read',
    ],
  },
  'manager-token-001': {
    id: 'manager-001',
    name: '李店长',
    role: UserRole.STORE_MANAGER,
    storeId: 'store-001',
    permissions: [
      'member:create',
      'member:read',
      'member:update',
      'member:approve',
      'member:reject',
      'baby:create',
      'baby:read',
      'baby:update',
      'reminder:read',
      'reminder:handle',
    ],
  },
  'purchaser-token-001': {
    id: 'purchaser-001',
    name: '王采购',
    role: UserRole.PURCHASER,
    permissions: [
      'member:read',
      'baby:read',
      'reminder:read',
      'reminder:configure',
      'product:manage',
    ],
  },
};

function mockAuthMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.replace('Bearer ', '');

  if (token && mockUsers[token]) {
    req.user = mockUsers[token];
  } else {
    req.user = mockUsers['clerk-token-001'];
  }

  next();
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    })
  );

  app.useGlobalFilters(new GlobalExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  app.use(mockAuthMiddleware);

  app.enableCors();

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`
========================================
母婴零售店会员建档与宝宝月龄提醒系统
========================================
服务已启动: http://localhost:${port}

角色入口:
  店员入口: /clerk/*
  店长入口: /manager/*
  采购入口: /purchaser/*

测试Token:
  店员: Bearer clerk-token-001
  店长: Bearer manager-token-001
  采购: Bearer purchaser-token-001
========================================
  `);
}

bootstrap();