#!/bin/bash

echo "正在清理旧的依赖..."
rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml

echo "正在安装依赖..."
npm install

echo "安装完成！"
echo "启动开发服务器..."
npm run dev
