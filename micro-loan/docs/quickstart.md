# 快速开始指南

## 环境准备

### 1. 安装 Go
确保已安装 Go 1.21 或更高版本：
```bash
go version
```

### 2. 安装 MySQL
确保已安装 MySQL 5.7 或更高版本：
```bash
mysql --version
```

### 3. 克隆项目
```bash
cd /path/to/your/workspace
```

## 项目设置

### 1. 配置环境变量
```bash
cd micro-loan
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=micro_loan
SERVER_PORT=8080
```

### 2. 创建数据库
```bash
mysql -u root -p < scripts/init_db.sql
```

或者手动创建：
```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS micro_loan CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
```

### 3. 安装依赖
```bash
go mod download
```

## 运行项目

### 方式一：使用 Makefile
```bash
make run
```

### 方式二：直接运行
```bash
go run cmd/main.go
```

### 方式三：编译后运行
```bash
make build
./bin/micro-loan
```

## 验证部署

### 健康检查
```bash
curl http://localhost:8080/health
```

应该返回：
```json
{
  "status": "ok"
}
```

## 测试 API

### 1. 创建借款申请
```bash
curl -X POST http://localhost:8080/api/v1/customer-manager/loans \
  -H "Content-Type: application/json" \
  -d '{
    "customer_id": "C001",
    "customer_name": "张三",
    "loan_amount": 50000,
    "loan_term": 12,
    "interest_rate": 0.02,
    "operator_id": "M001",
    "operator_role": "customer_manager"
  }'
```

### 2. 上传资料
```bash
curl -X POST http://localhost:8080/api/v1/customer-manager/documents \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "document_type": "id_card",
    "document_url": "https://example.com/docs/id_card.jpg",
    "operator_id": "M001",
    "operator_role": "customer_manager"
  }'
```

### 3. 查询借款申请
```bash
curl http://localhost:8080/api/v1/customer-manager/loans/1
```

### 4. 幂等提交资料
```bash
curl -X POST http://localhost:8080/api/v1/customer-manager/documents/submit \
  -H "Content-Type: application/json" \
  -d '{
    "loan_application_id": 1,
    "operator_id": "M001",
    "operator_role": "customer_manager"
  }'
```

更多测试示例请参考 [docs/api_test_examples.md](docs/api_test_examples.md)

## 项目结构说明

```
micro-loan/
├── cmd/              # 入口文件
├── internal/         # 内部包
│   ├── config/      # 配置
│   ├── models/      # 数据模型
│   ├── repository/  # 数据访问
│   ├── services/    # 业务逻辑
│   ├── handlers/    # 路由处理
│   └── middleware/  # 中间件
├── pkg/             # 公共工具
├── scripts/         # 脚本
├── docs/            # 文档
└── go.mod          # Go模块
```

## 常见问题

### 1. 数据库连接失败
- 检查 MySQL 服务是否启动
- 验证用户名密码是否正确
- 确认数据库是否已创建

### 2. 端口被占用
- 修改 `.env` 中的 `SERVER_PORT`
- 或者终止占用端口的进程

### 3. 依赖下载失败
- 检查网络连接
- 使用代理：
  ```bash
  export GOPROXY=https://goproxy.cn,direct
  go mod download
  ```

## 下一步

- 阅读 [README.md](README.md) 了解完整功能
- 阅读 [docs/architecture.md](docs/architecture.md) 了解技术架构
- 阅读 [docs/api_test_examples.md](docs/api_test_examples.md) 查看更多 API 示例
