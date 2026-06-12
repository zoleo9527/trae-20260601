# 会计代账公司-原始票据与资料缺口管理系统

## 系统简介

本系统用于会计代账公司管理客户的原始票据与资料缺口，避免临近申报时才发现资料缺失。

## 角色分工

- **会计**：维护资料清单
- **客户经理**：负责催交
- **主管**：查看风险汇总

## 核心功能

### 1. 资料项配置
- 支持发票、银行回单、工资表、合同、库存表等类型
- 可配置资料项是否必须、应交日期等

### 2. 缺口标记
- 记录客户应该交什么、已经交什么、还差什么
- 支持按客户、期间、状态、风险等级筛选
- 支持批量标记缺口

### 3. 催交记录
- 记录客户经理的催交过程
- 包含催交方式、内容、客户回复等
- 支持设置下次跟进日期

### 4. 客户补交
- 记录客户提交的资料
- 自动更新缺口状态

### 5. 风险汇总
- 主管查看会影响申报的风险项
- 支持按风险等级筛选
- 提供解决建议

## 安装与运行

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

### 2. 初始化数据库并创建种子数据

```bash
python -m app.seed_data
```

### 3. 启动服务

```bash
python run.py
```

服务将在 http://localhost:8000 启动

### 4. 访问 API 文档

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## API 端点

### 资料项配置
- `POST /document-types/` - 创建资料项
- `GET /document-types/` - 获取资料项列表
- `GET /document-types/{id}` - 获取单个资料项
- `PUT /document-types/{id}` - 更新资料项
- `DELETE /document-types/{id}` - 删除资料项

### 客户管理
- `POST /customers/` - 创建客户
- `GET /customers/` - 获取客户列表
- `GET /customers/{id}` - 获取单个客户
- `PUT /customers/{id}` - 更新客户
- `DELETE /customers/{id}` - 删除客户

### 资料缺口管理
- `POST /document-gaps/` - 创建资料缺口
- `GET /document-gaps/` - 获取缺口列表（支持按客户、期间、状态、风险等级、资料类别筛选）
- `GET /document-gaps/{id}` - 获取单个缺口
- `PUT /document-gaps/{id}` - 更新缺口
- `DELETE /document-gaps/{id}` - 删除缺口
- `POST /document-gaps/batch-mark` - 批量标记缺口

### 催交记录管理
- `POST /collection-records/` - 创建催交记录
- `GET /collection-records/` - 获取催交记录列表
- `GET /collection-records/{id}` - 获取单个催交记录
- `DELETE /collection-records/{id}` - 删除催交记录

### 客户补交管理
- `POST /submissions/` - 创建补交记录（自动更新缺口状态）
- `GET /submissions/` - 获取补交记录列表
- `GET /submissions/{id}` - 获取单个补交记录
- `DELETE /submissions/{id}` - 删除补交记录

### 风险汇总管理
- `POST /risks/` - 创建风险汇总
- `GET /risks/` - 获取风险汇总列表
- `GET /risks/report` - 获取风险报告（仅显示影响申报的风险）
- `GET /risks/{id}` - 获取单个风险汇总
- `PUT /risks/{id}` - 更新风险解决状态
- `DELETE /risks/{id}` - 删除风险汇总
- `GET /risks/customer-status/{customer_id}` - 获取客户资料状态概览

## 种子数据

系统包含以下种子数据：

### 客户
1. **长期拖票科技有限公司** - 长期拖票客户，多个资料项逾期
2. **只差银行回单贸易有限公司** - 只差银行回单的客户
3. **正常提交客户服务有限公司** - 正常提交客户

### 资料项配置
- 增值税发票（发票类，必须，每月10日前）
- 银行回单（银行回单类，必须，每月10日前）
- 工资表（工资表类，必须，每月15日前）
- 销售合同（合同类，非必须，每月20日前）
- 库存盘点表（库存表类，非必须，每月25日前）

## 数据模型

### 主要实体
- **Customer** - 客户
- **DocumentType** - 资料项配置
- **DocumentGap** - 资料缺口
- **DocumentSubmission** - 资料提交记录
- **CollectionRecord** - 催交记录
- **RiskSummary** - 风险汇总

### 枚举类型
- **DocumentCategory** - 资料类别（发票、银行回单、工资表、合同、库存表）
- **RiskLevel** - 风险等级（高、中、低）
- **GapStatus** - 缺口状态（待提交、已提交、逾期未交）

## 技术栈

- **框架**：FastAPI
- **数据库**：SQLite（可切换到其他数据库）
- **ORM**：SQLAlchemy
- **数据验证**：Pydantic