# 瓷砖门店量房登记与方案报价系统 - 部署说明

## 项目概述

本系统是为瓷砖门店设计的量房登记与方案报价后端服务，主要解决量房登记和方案报价之间的责任不清问题。系统采用分层架构设计，确保导购、设计师、仓库员等不同角色有独立的操作权限和数据视图。

## 技术栈

- **语言**: Java 21
- **框架**: Spring Boot 3.2.0
- **数据库**: MySQL 8.0+
- **ORM**: MyBatis Plus 3.5.5
- **连接池**: Druid 1.2.20

## 快速开始

### 1. 环境要求

- JDK 21+
- Maven 3.8+
- MySQL 8.0+

### 2. 数据库配置

创建数据库并执行初始化脚本：

```sql
CREATE DATABASE example_db DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE example_db;
SOURCE backend/src/main/resources/schema.sql;
```

### 3. 配置文件修改

编辑 `backend/src/main/resources/application.yml`，配置数据库连接信息：

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/example_db?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: your_username
    password: your_password
```

### 4. 启动项目

**开发态运行：**

```bash
cd backend
mvn spring-boot:run
```

**打包构建：**

```bash
cd backend
mvn clean package
```

**运行打包后的 Jar：**

```bash
java -jar target/tile-store-1.0.0.jar
```

服务默认运行在 `http://localhost:8080`

## API 接口列表

### 认证接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/auth/login | 用户登录 | 公开 |
| POST | /api/auth/logout | 用户退出 | 已登录 |

### 量房登记接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/measurements | 创建量房记录 | SALESMAN, ADMIN |
| GET | /api/measurements/{id} | 查询量房记录详情 | 已登录 |
| PUT | /api/measurements/{id} | 更新量房记录 | SALESMAN, DESIGNER, ADMIN |
| POST | /api/measurements/{id}/assign | 分配设计师 | SALESMAN, ADMIN |
| POST | /api/measurements/{id}/complete | 完成量房 | DESIGNER, ADMIN |
| GET | /api/measurements | 查询量房列表 | 已登录 |
| GET | /api/measurements/{id}/history | 查询量房操作历史 | 已登录 |

### 报价单接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| POST | /api/quotations | 创建报价单 | DESIGNER, ADMIN |
| GET | /api/quotations/{id} | 查询报价单详情 | 已登录 |
| PUT | /api/quotations/{id} | 更新报价单 | DESIGNER, ADMIN |
| POST | /api/quotations/{id}/submit | 提交报价单审核 | DESIGNER, ADMIN |
| POST | /api/quotations/{id}/approve | 审核通过报价单 | ADMIN |
| POST | /api/quotations/{id}/reject | 拒绝报价单 | ADMIN |
| POST | /api/quotations/{id}/sign | 签署报价单 | SALESMAN, ADMIN |
| GET | /api/quotations | 查询报价单列表 | 已登录 |
| GET | /api/quotations/{id}/history | 查询报价单操作历史 | 已登录 |

### 产品接口

| 方法 | 路径 | 描述 | 权限 |
|------|------|------|------|
| GET | /api/products | 查询产品列表 | 已登录 |
| GET | /api/products/{id} | 查询产品详情 | 已登录 |

## 内置测试账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| admin | admin123 | ADMIN | 管理员 |
| salesman001 | 123456 | SALESMAN | 导购张三 |
| designer001 | 123456 | DESIGNER | 设计师李四 |
| warehouse001 | 123456 | WAREHOUSE | 仓库员王五 |

## 角色权限说明

### SALESMAN（导购）
- 可创建量房记录
- 可更新自己创建的量房记录
- 可分配设计师
- 可签署已审核的报价单

### DESIGNER（设计师）
- 可查看分配给自己的量房记录
- 可更新分配给自己的量房记录
- 可完成量房
- 可创建/更新报价单
- 可提交报价单审核

### WAREHOUSE（仓库员）
- 可查看量房记录和报价单（只读）

### ADMIN（管理员）
- 拥有所有权限

## 系统边界说明

### 当前未接入的外部系统

1. **支付系统**
   - 报价单签署后未对接实际支付流程
   - 无订单支付状态同步机制

2. **库存管理系统**
   - 报价单创建时未实时扣减库存
   - 无库存预警机制
   - 产品库存仅为静态数据展示

3. **消息通知系统**
   - 无短信/微信推送通知功能
   - 无消息队列异步通知机制

4. **文件存储系统**
   - 量房照片仅存储路径字符串
   - 未集成云存储（如阿里云OSS、腾讯云COS）

5. **权限认证系统**
   - 当前使用模拟登录，无JWT/Token机制
   - 无细粒度权限控制（RBAC）
   - 无会话管理和超时机制

6. **数据报表系统**
   - 无统计分析功能
   - 无数据导出功能

### 业务边界

1. **客户管理**
   - 客户信息仅包含基础字段（姓名、电话、地址）
   - 无客户分类、标签管理
   - 无客户跟进记录

2. **量房管理**
   - 一个量房记录对应一个房型
   - 不支持批量量房
   - 面积计算仅支持矩形（长×宽）

3. **报价管理**
   - 报价单状态流转：DRAFT → SUBMITTED → APPROVED/REJECTED → SIGNED
   - 拒绝后的报价单需重新编辑提交
   - 无报价版本管理

4. **产品管理**
   - 产品数据为静态预置
   - 无产品分类层级结构
   - 无价格变更历史

### 技术边界

1. **数据库**
   - 使用MySQL，未做读写分离
   - 无数据库连接池监控
   - 无数据备份和恢复机制

2. **API**
   - 无API限流和熔断机制
   - 无接口调用日志记录
   - 无API版本管理

3. **安全**
   - 密码明文存储（生产环境需加密）
   - 无SQL注入防护（依赖MyBatis参数化查询）
   - 无XSS攻击防护

## 后续扩展建议

1. 集成Spring Security + JWT实现完整认证
2. 添加Redis缓存热门数据
3. 集成消息队列处理异步任务
4. 添加API网关和限流组件
5. 实现库存扣减事务
6. 添加支付对接接口
7. 实现报表统计功能