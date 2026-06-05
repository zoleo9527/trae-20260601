#!/bin/bash

echo "🧗 攀岩馆运营系统 - 启动脚本"
echo "================================"

# 清理端口
echo "清理端口..."
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3000 | xargs kill -9 2>/dev/null

# 确保 data 目录存在
mkdir -p data

# 启动后端
echo "启动后端服务 (端口 3001)..."
cd "$(dirname "$0")"
node server/index.js &
SERVER_PID=$!

# 等待后端启动
sleep 2

# 检查后端是否启动成功
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ 后端服务启动成功: http://localhost:3001"
else
    echo "⚠️  后端启动可能需要更长时间，请手动检查"
fi

# 启动前端
echo "启动前端服务 (端口 3000)..."
cd client
npm start &
CLIENT_PID=$!

echo ""
echo "================================"
echo "🚀 系统启动中..."
echo "后端 API: http://localhost:3001"
echo "前端地址: http://localhost:3000"
echo "================================"
echo ""
echo "演示账号（密码均为 123456）:"
echo "  frontdesk - 林前台"
echo "  belayer1  - 张保护"
echo "  belayer2  - 王保护"
echo "  routesetter - 陈定线"
echo "  manager   - 李经理"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '正在停止服务...'; kill $SERVER_PID $CLIENT_PID 2>/dev/null; exit 0" INT

wait
