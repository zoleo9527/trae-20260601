#!/bin/bash

echo "========================================"
echo "人力派遣公司-用工需求与候选人匹配系统"
echo "========================================"

echo ""
echo "1. 启动后端服务..."
cd labor-dispatch/server
npm install
npx prisma generate
npx prisma db push
npm run seed &
SERVER_PID=$!

echo "后端服务 PID: $SERVER_PID"
echo "等待后端服务启动..."
sleep 5

echo ""
echo "2. 启动前端服务..."
cd ../client
npm install
npm run dev &
CLIENT_PID=$!

echo "前端服务 PID: $CLIENT_PID"
echo "等待前端服务启动..."
sleep 3

echo ""
echo "========================================"
echo "系统已启动！"
echo "========================================"
echo ""
echo "后端服务: http://localhost:3001"
echo "前端服务: http://localhost:5173"
echo ""
echo "演示账号:"
echo "  管理员: admin / admin123"
echo "  一线人员: user / user123"
echo ""
echo "按 Ctrl+C 停止服务"
echo "========================================"

wait
