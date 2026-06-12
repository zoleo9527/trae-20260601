#!/bin/bash

echo "🚀 启动前端服务..."

if [ ! -d "node_modules" ]; then
    echo "📦 安装依赖..."
    npm install
fi

echo "🌟 启动服务在 http://localhost:5173"
npm run dev
