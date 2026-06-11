#!/bin/bash
cd "$(dirname "$0")/elevator-maintenance"
export JAVA_HOME="/opt/homebrew/opt/openjdk@11"
export PATH="$JAVA_HOME/bin:$PATH"
echo "正在启动后端服务 (端口 8080)..."
mvn spring-boot:run
