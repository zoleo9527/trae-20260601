#!/bin/bash

echo "🚀 启动后端服务..."

if [ ! -d "venv" ]; then
    echo "📦 创建虚拟环境..."
    python3 -m venv venv
fi

source venv/bin/activate

echo "📦 安装依赖..."
pip install -r requirements.txt

if [ ! -f "real_estate.db" ]; then
    echo "🗄️  初始化数据库和示例数据..."
    python init_data.py
fi

echo "🌟 启动服务在 http://localhost:8000"
echo "📚 API文档: http://localhost:8000/docs"
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
