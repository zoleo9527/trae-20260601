#!/bin/bash

echo "=== 摄影器材租赁管理系统 ==="

if [ ! -d "venv" ]; then
    echo "创建虚拟环境..."
    python3 -m venv venv
fi

echo "激活虚拟环境..."
source venv/bin/activate

echo "安装依赖..."
pip install -r requirements.txt

echo "初始化模拟数据..."
python -c "from app.init_data import init_mock_data; init_mock_data()"

echo "启动服务器..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
