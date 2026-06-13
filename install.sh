#!/bin/bash

set -e

echo "🚀 开始安装企业内训管理系统..."

echo "📦 安装前端依赖..."
npm install

echo "📦 安装后端依赖..."
cd api
npm install

echo "🗄️ 生成Prisma Client..."
npx prisma generate

echo "🗄️ 初始化数据库..."
npx prisma db push

echo "🌱 创建种子数据..."
tsx prisma/seed.ts

echo "✅ 安装完成！"
echo ""
echo "启动开发服务器："
echo "  npm run dev"
echo ""
echo "前端访问：http://localhost:5173"
echo "后端API：http://localhost:3000"
echo ""
echo "测试账号："
echo "  培训经理：zhang@company.com / password123"
echo "  讲师：wang@company.com / password123"
echo "  部门负责人：li.manager@company.com / password123"
echo "  学员：zhao@company.com / password123"
