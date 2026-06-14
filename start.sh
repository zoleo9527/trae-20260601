#!/bin/bash

echo "================================"
echo "司法鉴定所系统启动脚本"
echo "================================"
echo ""

# 获取脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_ROOT"

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ Node.js 版本: $(node --version)"
echo ""

# 初始化数据库
echo "📦 初始化数据库..."
cd "$PROJECT_ROOT/backend"
node seed.js
if [ $? -ne 0 ]; then
    echo "❌ 数据库初始化失败"
    exit 1
fi
echo ""

# 安装后端依赖
echo "📦 安装后端依赖..."
npm install
if [ $? -ne 0 ]; then
    echo "❌ 后端依赖安装失败"
    exit 1
fi
echo ""

# 安装前端依赖
echo "📦 安装前端依赖..."
cd "$PROJECT_ROOT/frontend"
npm install
if [ $? -ne 0 ]; then
    echo "❌ 前端依赖安装失败"
    exit 1
fi
echo ""

# 启动后端服务
echo "🚀 启动后端服务..."
cd "$PROJECT_ROOT/backend"
npm start &
BACKEND_PID=$!
echo "后端服务 PID: $BACKEND_PID"
echo ""

# 等待后端启动
sleep 3

# 启动前端服务
echo "🚀 启动前端服务..."
cd "$PROJECT_ROOT/frontend"
npm start &
FRONTEND_PID=$!
echo "前端服务 PID: $FRONTEND_PID"
echo ""

echo "================================"
echo "✅ 服务启动成功！"
echo "================================"
echo ""
echo "📍 前端地址: http://localhost:3000"
echo "📍 后端地址: http://localhost:5001"
echo "📍 API地址: http://localhost:5001/api/v1"
echo ""
echo "演示账号:"
echo "  受理员：acceptor01 / demo123"
echo "  鉴定人：appraiser01 / demo123"
echo "  质控审核：qc01 / demo123"
echo "  管理员：admin / admin123"
echo ""
echo "按 Ctrl+C 停止所有服务"
echo "================================"

# 等待信号
wait
