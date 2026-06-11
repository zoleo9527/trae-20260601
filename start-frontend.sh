#!/bin/bash
cd "$(dirname "$0")/elevator-maintenance-web"
echo "正在启动前端服务 (端口 5173)..."
npm run dev
