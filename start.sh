#!/bin/bash

echo "安装依赖..."
pip install -r requirements.txt

echo "初始化数据库和测试数据..."
python -m app.init_data

echo "启动服务器..."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000