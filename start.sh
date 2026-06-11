#!/bin/bash
set -e

echo "============================================"
echo " 奥特莱斯运营 - 品牌租约与扣点规则 系统启动"
echo "============================================"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# 清理端口
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

echo ""
echo "[1/4] 检查后端依赖..."
if [ ! -d "$BACKEND_DIR/node_modules" ]; then
  echo "  首次启动，安装后端依赖..."
  cd "$BACKEND_DIR" && npm install
fi

echo ""
echo "[2/4] 清理历史数据库 (可选)..."
if [ -f "$BACKEND_DIR/data/outlet.db" ]; then
  echo "  保留已有数据库，如需重置请手动删除: backend/data/outlet.db*"
fi

echo ""
echo "[3/4] 启动后端服务 (端口: 3000)..."
cd "$BACKEND_DIR"
rm -f /tmp/backend.log
nohup node src/app.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "  后端 PID: $BACKEND_PID"

# 等待后端启动
for i in {1..15}; do
  sleep 1
  if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "  ✅ 后端启动成功"
    break
  fi
  echo "  等待后端... ($i/15)"
done

echo ""
echo "[4/4] 安装并启动前端 (端口: 5173)..."
cd "$FRONTEND_DIR"
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
  echo "  首次启动，安装前端依赖..."
  npm install
fi

echo "  启动 Vite 开发服务器..."
npm run dev
