# 再生资源分拣中心 - 品级确认系统

## 系统概述

本系统完整支持再生资源分拣中心的品级确认流程，从进厂混装登记开始，经过分选班组作业、销售内勤品级判定、复核员复核调整，最终完成库存入账。品级被复核调整时，系统会自动保留调整前后的差异记录，确保结算数据可追溯。

## 业务流程

```
过磅员(进厂登记) → 分拣班长(分选记录) → 销售内勤(品级报价) → 复核员(品级调整) → 库存入账
```

### 角色职责

1. **过磅员** - 负责来源和重量登记
   - 登记货物来源、供应商、车辆信息
   - 记录毛重、皮重，自动计算净重
   - 生成批次号

2. **分拣班长** - 记录分选结果
   - 按批次记录各品类分选重量
   - 上传品级照片占位
   - 记录分选损耗

3. **销售内勤** - 品级判定和报价
   - 根据分选结果进行品级判定（A-E级）
   - 按品级报价计算金额
   - 支持降级处理

4. **复核员** - 品级复核调整
   - 对品级判定进行复核
   - 调整时自动保留前后差异记录
   - 记录调整原因和金额差异

5. **库存管理员** - 库存入账
   - 完成品级判定的物料入库
   - 记录仓库和库位信息

## 技术栈

- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **前端**: 原生HTML/CSS/JavaScript (单页应用)

## 目录结构

```
.
├── backend/                    # 后端服务
│   ├── src/
│   │   ├── config/            # 配置文件
│   │   │   └── database.ts    # 数据库连接
│   │   ├── routes/            # API路由
│   │   │   ├── batch.routes.ts
│   │   │   ├── sorting.routes.ts
│   │   │   ├── grade.routes.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── price.routes.ts
│   │   ├── services/          # 业务逻辑服务
│   │   │   ├── batch.service.ts
│   │   │   ├── sorting.service.ts
│   │   │   ├── grade.service.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── price.service.ts
│   │   ├── scripts/           # 脚本
│   │   │   ├── initDb.ts      # 数据库初始化
│   │   │   └── seedData.ts    # 演示数据
│   │   ├── types/             # TypeScript类型定义
│   │   │   └── index.ts
│   │   ├── utils/             # 工具函数
│   │   │   └── helpers.ts
│   │   └── server.ts          # 服务入口
│   ├── data/                  # 数据库文件目录
│   ├── package.json
│   └── tsconfig.json
└── frontend/                   # 前端界面
    └── index.html             # 单页应用
```

## 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 初始化数据库

```bash
npm run init-db
```

### 3. 导入演示数据

```bash
npm run seed-data
```

演示数据包含三个完整场景：

**场景一：混装进厂 → 正常流程**
- 混装塑料分选成PET、HDPE、PVC
- 正常品级判定和入库

**场景二：降级处理**
- PP材料由预估B级降为C级
- 废纸由预估B级降为D级
- 系统自动计算金额损失

**场景三：复核改判**
- PET原判定B级，复核改判为A级
- 金属原判定C级，复核改判为B级
- 系统完整记录调整前后差异

### 4. 启动服务

```bash
npm run dev
```

服务启动后访问:
- **后端API**: http://localhost:3000/api
- **前端界面**: 直接打开 `frontend/index.html`

### 5. 演示账号

| 用户名 | 姓名 | 角色 |
|--------|------|------|
| weigher01 | 张过磅 | 过磅员 |
| foreman01 | 李班长 | 分拣班长 |
| sales01 | 王销售 | 销售内勤 |
| reviewer01 | 赵复核 | 复核员 |

## API 接口

### 批次管理
- `POST /api/batches` - 创建进厂批次
- `GET /api/batches` - 获取批次列表
- `GET /api/batches/:id` - 获取批次详情
- `PATCH /api/batches/:id/status` - 更新批次状态

### 分选记录
- `POST /api/sorting` - 创建分选记录
- `GET /api/sorting` - 获取分选记录列表
- `GET /api/sorting/batch/:batchId` - 获取批次分选记录
- `GET /api/sorting/materials/batch/:batchId` - 获取批次分选物料

### 品级判定
- `POST /api/grades` - 创建品级判定
- `GET /api/grades` - 获取品级判定列表
- `GET /api/grades/batch/:batchId` - 获取批次品级判定
- `PATCH /api/grades/:id/review` - 复核改判

### 库存管理
- `POST /api/inventory` - 创建库存记录
- `GET /api/inventory` - 获取库存列表
- `GET /api/inventory/batch/:batchId` - 获取批次库存记录
- `GET /api/inventory/statistics/summary` - 获取库存汇总
- `GET /api/inventory/reviews` - 获取复核记录列表

### 价格管理
- `POST /api/prices` - 添加价格
- `GET /api/prices/active` - 获取有效价格列表
- `GET /api/prices/matrix` - 获取价格矩阵

### 用户管理
- `POST /api/users` - 创建用户
- `GET /api/users` - 获取用户列表
- `GET /api/users/role/:role` - 按角色获取用户

## 数据模型

### 核心实体

1. **InboundBatch (进厂批次)**
   - 批次号、来源、供应商、车牌号
   - 毛重、皮重、净重
   - 过磅员、状态、备注

2. **SortingRecord (分选记录)**
   - 关联批次、分选班组、分拣班长
   - 分选物料列表、总分选重量、损耗
   - 备注

3. **SortedMaterial (分选物料)**
   - 物料类型、重量
   - 品级、单价、金额
   - 照片占位URL、是否入库

4. **GradeJudgment (品级判定)**
   - 原估品级、判定品级
   - 单价、重量、金额
   - 判定人、照片、备注、是否复核

5. **ReviewRecord (复核记录)**
   - 原品级/单价/金额
   - 新品级/单价/金额
   - 品级差异、价格差异、金额差异
   - 复核人、复核原因

6. **InventoryRecord (库存记录)**
   - 批次、物料、品级、重量、金额
   - 仓库、库位
   - 入库员、备注

## 品级说明

| 品级 | 说明 |
|------|------|
| A | 优质品，无污渍、无破损 |
| B | 良好品，轻微使用痕迹 |
| C | 合格品，有明显磨损但可使用 |
| D | 等外品，质量较差需特殊处理 |
| E | 残次品，只能降级使用或报废 |

## 价格体系示例

| 材料 | A级 | B级 | C级 | D级 | E级 |
|------|-----|-----|-----|-----|-----|
| PET瓶 | 3.50 | 2.80 | 2.20 | 1.50 | 0.80 |
| HDPE | 3.20 | 2.60 | 2.00 | 1.30 | 0.70 |
| PVC | 2.80 | 2.30 | 1.80 | 1.10 | 0.60 |
| PP | 3.80 | 3.10 | 2.50 | 1.70 | 0.90 |
| 废纸 | 1.80 | 1.50 | 1.20 | 0.80 | 0.40 |
| 金属 | 12.00 | 10.00 | 8.00 | 5.00 | 3.00 |

## 核心特性

1. **品级差异追溯** - 复核调整时完整记录前后差异，包括品级差、单价差、金额差
2. **照片占位** - 支持品级照片上传占位，便于后续证据查看
3. **状态流转** - 批次状态从创建到入库完整追踪
4. **价格体系** - 支持不同材料不同品级的动态价格管理
5. **数据汇总** - 库存按物料、品级、仓库多维度汇总统计
6. **损耗计算** - 自动计算分选损耗重量

## 演示场景详解

### 场景一：混装进厂正常流程

1. 过磅员登记：来源海淀区回收点，12500kg毛重，3500kg皮重，净重9000kg
2. 分选班长分选：PET 4200kg, HDPE 2800kg, PVC 1500kg, 其他 300kg
3. 销售内勤判定：PET A级 3.50元/kg，HDPE B级 2.60元/kg，PVC C级 1.80元/kg
4. 库存入账：分别入A仓库、B仓库对应库位

### 场景二：降级处理

1. 过磅员登记：来源朝阳区回收站，净重6600kg
2. 分选班长分选：PP 3500kg, 废纸 2200kg
3. 销售内勤降级判定：
   - PP原预估B级(3.10元)，实际降为C级(2.50元)，损失2100元
   - 废纸原预估B级(1.50元)，实际降为D级(0.80元)，损失1540元

### 场景三：复核改判

1. 过磅员登记：来源丰台区工业园，净重11000kg
2. 分选班长分选：PET 5500kg, 金属 3800kg, HDPE 1200kg
3. 销售内勤初判：PET B级，金属 C级，HDPE A级
4. 复核员改判：
   - PET B级→A级，单价2.80→3.50，金额调整+3850元
   - 金属 C级→B级，单价8.00→10.00，金额调整+7600元
   - 本批次复核总调整：+11450元

## 开发说明

### 编译运行

```bash
# 开发模式
npm run dev

# 编译生产版本
npm run build

# 运行生产版本
npm start
```

### 数据库

数据库文件位于 `backend/data/recycling.db`，使用SQLite，无需额外安装数据库服务。

### API响应格式

所有API统一响应格式：
```json
{
  "success": true,
  "data": {},
  "message": "操作成功"
}
```

错误响应：
```json
{
  "success": false,
  "error": "错误信息"
}
```
