#!/usr/bin/env bash

echo "=========================================="
echo "  会计代账公司-税期申报与异常提醒系统"
echo "  一键启动脚本"
echo "=========================================="
echo ""

cd "$(dirname "$0")"

echo "📦 检查并安装后端依赖..."
if [ ! -d "node_modules" ]; then
  npm install
else
  echo "   后端依赖已存在，跳过安装"
fi

echo ""
echo "📦 检查并安装前端依赖..."
if [ ! -d "client/node_modules" ]; then
  cd client && npm install && cd ..
else
  echo "   前端依赖已存在，跳过安装"
fi

echo ""
echo "🚀 启动后端服务 (端口 3001)..."
node server/index.js &
SERVER_PID=$!

sleep 2

echo ""
echo "🌐 启动前端开发服务 (端口 5173)..."
cd client && npm run dev &
CLIENT_PID=$!

cd ..

echo ""
echo "=========================================="
echo ""
echo "✅ 系统启动中..."
echo ""
echo "   后端 API:  http://localhost:3001"
echo "   前端页面:  http://localhost:5173"
echo ""
echo "   按 Ctrl+C 停止所有服务"
echo ""
echo "=========================================="

trap "echo ''; echo '🛑 正在停止服务...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT

wait
