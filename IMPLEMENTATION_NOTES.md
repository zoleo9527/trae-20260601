# 卫浴安装队-安装验收与照片回传系统 - 实现说明

## 一、系统概述

本系统旨在解决卫浴安装队当前依赖旧台账、现场记录和沟通截图进行安装验收和照片回传的问题，通过规范化的流程和留痕机制，明确责任界定，提升工作效率。

## 二、核心业务流程

### 2.1 角色定义

| 角色 | 职责 | 系统权限 |
|------|------|----------|
| 安装调度 | 创建工单、分配安装师傅 | 创建工单、派工、查看所有工单 |
| 安装师傅 | 执行安装、上传照片、提交验收 | 查看自己的工单、上传照片、提交验收 |
| 售后客服 | 审核照片、确认验收结果 | 查看工单、审核照片、确认验收 |
| 管理员 | 系统管理、用户管理 | 全部权限 |

### 2.2 流程顺序

```
1. 安装调度创建工单 → 记录创建人
       ↓
2. 安装调度派工给安装师傅 → 记录派工人、时间
       ↓
3. 安装师傅完成安装 → 记录完成人、时间
       ↓
4. 安装师傅上传现场照片 → 记录上传人、时间、照片类型
       ↓
5. 售后客服审核照片 → 记录审核人、时间、审核结果
       ↓
6. 安装师傅提交验收申请 → 记录提交人、时间、验收意见
       ↓
7. 售后客服确认验收 → 记录确认人、时间、最终结果
```

## 三、接口清单

### 3.1 安装工单接口

| API路径 | HTTP方法 | 功能描述 | 所属Controller |
|---------|----------|----------|----------------|
| `/installations` | POST | 创建安装工单 | InstallationController |
| `/installations` | GET | 分页查询工单列表 | InstallationController |
| `/installations/:id` | GET | 查询单个工单详情 | InstallationController |
| `/installations/:id` | PATCH | 更新工单信息 | InstallationController |
| `/installations/:id/dispatch` | POST | 派工给安装师傅 | InstallationController |
| `/installations/:id/complete` | POST | 标记安装完成 | InstallationController |
| `/installations/:id/records` | GET | 查询工单操作记录 | InstallationController |

### 3.2 照片管理接口

| API路径 | HTTP方法 | 功能描述 | 所属Controller |
|---------|----------|----------|----------------|
| `/photos/upload` | POST | 上传照片 | PhotoController |
| `/photos` | GET | 分页查询照片列表 | PhotoController |
| `/photos/:id` | GET | 查询照片详情 | PhotoController |
| `/photos/installation/:installationId` | GET | 查询工单关联照片 | PhotoController |
| `/photos/download/:fileName` | GET | 下载照片文件 | PhotoController |
| `/photos/:id/verify` | PATCH | 审核单张照片 | PhotoController |
| `/photos/installation/:installationId/verify` | PATCH | 批量审核工单照片 | PhotoController |
| `/photos/:id` | DELETE | 删除照片 | PhotoController |

### 3.3 验收接口

| API路径 | HTTP方法 | 功能描述 | 所属Controller |
|---------|----------|----------|----------------|
| `/acceptance/submit` | POST | 提交验收申请（支持幂等） | AcceptanceController |
| `/acceptance/verify` | POST | 确认验收结果（支持幂等） | AcceptanceController |
| `/acceptance/history/:installationId` | GET | 查询验收历史记录 | AcceptanceController |

### 3.4 用户管理接口

| API路径 | HTTP方法 | 功能描述 | 所属Controller |
|---------|----------|----------|----------------|
| `/users` | POST | 创建用户 | UserController |
| `/users` | GET | 查询用户列表 | UserController |
| `/users/:id` | GET | 查询用户详情 | UserController |
| `/users/:id` | PATCH | 更新用户信息 | UserController |
| `/users/:id` | DELETE | 删除用户 | UserController |

## 四、幂等性设计

### 4.1 实现机制

系统通过 `idempotencyKey` 参数实现接口幂等性：

1. **参数位置**：验收提交和验收确认接口支持 `idempotencyKey` 参数
2. **存储机制**：使用内存 Map 存储请求结果，有效期 24 小时
3. **校验逻辑**：
   - 接收请求时检查 `idempotencyKey` 是否存在
   - 若存在且未过期，直接返回缓存结果
   - 若不存在或已过期，执行业务逻辑并缓存结果

### 4.2 使用示例

```json
POST /acceptance/submit
{
  "installationId": "uuid-here",
  "isAccepted": true,
  "comment": "安装完成，符合要求",
  "idempotencyKey": "unique-request-id-12345"
}
```

## 五、简化说明

### 5.1 权限模块简化

**简化内容**：
- 当前实现使用 Mock 用户，未集成完整的认证授权系统
- 用户角色仅通过枚举定义，未实现基于角色的访问控制（RBAC）

**后续扩展建议**：
- 集成 JWT 认证机制
- 实现基于角色的权限控制
- 添加接口访问权限校验

### 5.2 附件模块简化

**简化内容**：
- 附件仅支持照片类型（图片文件）
- 文件存储使用本地文件系统
- 未实现文件大小限制、格式校验等安全措施

**后续扩展建议**：
- 支持多种附件类型（PDF报告、文档等）
- 集成云存储服务（如阿里云OSS、腾讯云COS）
- 添加文件格式、大小校验
- 实现文件压缩、水印功能

### 5.3 通知模块简化

**简化内容**：
- 未实现消息通知功能
- 状态变更无实时推送机制

**后续扩展建议**：
- 集成消息队列（如 Redis Pub/Sub、RabbitMQ）
- 实现站内消息通知
- 添加短信、微信推送通知
- 支持消息模板配置

### 5.4 外部系统集成简化

**简化内容**：
- 未与外部系统（ERP、CRM、财务系统）对接
- 工单数据独立存储，未同步到其他系统

**后续扩展建议**：
- 设计标准化 API 接口供外部系统调用
- 实现数据同步机制（定时同步、事件驱动）
- 支持 Webhook 机制通知外部系统
- 集成消息中间件实现异步通信

## 六、数据库表结构

### 6.1 用户表 (user)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| username | VARCHAR | 用户名（唯一） |
| password | VARCHAR | 密码 |
| name | VARCHAR | 真实姓名 |
| role | ENUM | 角色（dispatcher/installer/customer_service/admin） |
| phone | VARCHAR | 联系电话 |
| isActive | BOOLEAN | 是否启用 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 6.2 安装工单表 (installation)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| orderNo | VARCHAR | 订单编号 |
| customerName | VARCHAR | 客户姓名 |
| customerPhone | VARCHAR | 客户电话 |
| address | VARCHAR | 安装地址 |
| productType | VARCHAR | 产品类型 |
| productModel | VARCHAR | 产品型号 |
| productSerialNo | VARCHAR | 产品序列号 |
| description | TEXT | 安装说明 |
| status | ENUM | 状态（pending/dispatched/in_progress/completed/accepted/rejected/closed） |
| paymentStatus | ENUM | 付款状态（unpaid/partial/paid） |
| amount | DECIMAL | 金额 |
| scheduledDate | DATETIME | 计划安装日期 |
| actualDate | DATETIME | 实际安装日期 |
| dispatcherId | UUID | 调度员ID |
| installerId | UUID | 安装师傅ID |
| notes | TEXT | 备注 |
| feedback | TEXT | 反馈 |
| createdAt | DATETIME | 创建时间 |
| updatedAt | DATETIME | 更新时间 |

### 6.3 操作记录表 (installation_record)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| installationId | UUID | 工单ID |
| operatorId | UUID | 操作人ID |
| type | ENUM | 操作类型（dispatch/on_site/complete/accept/reject/comment） |
| content | TEXT | 操作内容 |
| metadata | VARCHAR | 附加数据 |
| createdAt | DATETIME | 创建时间 |

### 6.4 照片表 (photo)

| 字段名 | 类型 | 说明 |
|--------|------|------|
| id | UUID | 主键 |
| installationId | UUID | 工单ID |
| uploadedById | UUID | 上传人ID |
| type | ENUM | 照片类型（before/during/after/proof/other） |
| fileName | VARCHAR | 原始文件名 |
| filePath | VARCHAR | 存储路径 |
| fileSize | INTEGER | 文件大小 |
| fileType | VARCHAR | 文件类型 |
| status | ENUM | 状态（pending/verified/rejected） |
| description | TEXT | 描述 |
| verifiedBy | UUID | 审核人ID |
| verifiedAt | DATETIME | 审核时间 |
| uploadedAt | DATETIME | 上传时间 |

## 七、状态流转

### 7.1 工单状态流转

```
PENDING → DISPATCHED → IN_PROGRESS → COMPLETED → ACCEPTED → CLOSED
                          ↓                ↓
                     (重新派工)         REJECTED → (重新安装)
```

### 7.2 照片状态流转

```
PENDING → VERIFIED
    ↓
 REJECTED → (重新上传)
```

## 八、启动方式

```bash
# 安装依赖
npm install

# 开发模式运行
npm run start:dev

# 生产模式运行
npm run build
npm run start:prod
```

## 九、技术栈

- **框架**: NestJS 11.x
- **数据库**: SQLite（开发环境）/ PostgreSQL（生产环境）
- **ORM**: TypeORM
- **验证**: class-validator + class-transformer
- **文件上传**: multer

## 十、目录结构

```
src/
├── controllers/          # 控制器层
│   ├── acceptance.controller.ts
│   ├── installation.controller.ts
│   ├── photo.controller.ts
│   └── user.controller.ts
├── dto/                  # 数据传输对象
│   ├── acceptance.dto.ts
│   ├── installation.dto.ts
│   ├── photo.dto.ts
│   └── user.dto.ts
├── entities/             # 数据库实体
│   ├── installation.entity.ts
│   ├── installation-record.entity.ts
│   ├── photo.entity.ts
│   └── user.entity.ts
├── modules/              # 模块定义
│   ├── acceptance.module.ts
│   ├── installation.module.ts
│   ├── photo.module.ts
│   └── user.module.ts
├── services/             # 业务逻辑层
│   ├── acceptance.service.ts
│   ├── installation.service.ts
│   ├── photo.service.ts
│   └── user.service.ts
├── app.module.ts         # 主应用模块
└── main.ts               # 应用入口
```
