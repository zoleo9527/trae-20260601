# 驾校运营系统数据库初始化脚本

## 前置条件
1. 确保已安装 PostgreSQL
2. 确保 PostgreSQL 服务已启动

## 步骤

### 1. 创建数据库
```bash
createdb driving_school
```

或者使用 psql：
```bash
psql -U postgres -c "CREATE DATABASE driving_school;"
```

### 2. 配置环境变量
编辑 `.env` 文件，确保 DATABASE_URL 正确：
```
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/driving_school?schema=public"
```

### 3. 生成 Prisma Client
```bash
npm run db:generate
```

### 4. 创建数据库表
```bash
npm run db:push
```

### 5. 初始化测试数据
```bash
npm run db:seed
```

### 6. 启动开发服务器
```bash
npm run dev
```

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| advisor1 | password123 | 招生顾问 |
| coach1 | password123 | 教练 |
| examiner1 | password123 | 考试专员 |

## 访问地址
- 前端：http://localhost:5173
- 后端 API：http://localhost:3001
- API 健康检查：http://localhost:3001/api/health

## 验证数据库连接
```bash
curl http://localhost:3001/api/health
```
