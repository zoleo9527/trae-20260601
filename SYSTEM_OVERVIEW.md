# 摄影器材租赁管理系统 - 系统说明

## 一、系统概述

本系统是一个基于 FastAPI 的摄影器材租赁管理后端系统，重点解决**器材预约**与**押金冻结**之间的责任问题。

### 核心设计理念
1. **责任人和时间线追踪**：每一步状态变更都记录操作人和时间
2. **单记录整合**：器材预约、押金冻结、退回原因、补充备注在同一条记录中
3. **角色化待办**：门店店员、器材管理员、财务各自看到自己的待办事项

---

## 二、模拟数据位置

### 1. 数据库文件
- **位置**: `./camera_rental.db` (SQLite 数据库)
- **说明**: 运行系统后自动创建，存储所有业务数据

### 2. 模拟数据初始化脚本
- **位置**: [app/init_data.py](file:///Users/liu/Documents/private/model-test/trae-20260601-3/app/init_data.py)
- **包含数据**:
  - **6个用户账号**（3种角色各2人）
  - **8件摄影器材**（相机、镜头、配件、灯光）
  - **4条租赁记录**（覆盖不同状态：待审核、已确认、押金冻结、已归还）

### 3. 模拟用户列表
| 用户名 | 姓名 | 角色 | 用户ID |
|--------|------|------|--------|
| store_clerk_1 | 门店店员小李 | STORE_CLERK | 1 |
| store_clerk_2 | 门店店员小王 | STORE_CLERK | 2 |
| equip_admin_1 | 器材管理员老张 | EQUIPMENT_ADMIN | 3 |
| equip_admin_2 | 器材管理员老刘 | EQUIPMENT_ADMIN | 4 |
| finance_1 | 财务小陈 | FINANCE | 5 |
| finance_2 | 财务小周 | FINANCE | 6 |

---

## 三、角色入口与职责

### 1. 门店店员 (STORE_CLERK)
**主要职责**: 前台接待、器材取还登记

**待办事项触发场景**:
- 押金冻结完成 → 等待客户取件
- 客户预约成功 → 准备器材

**主要接口**:
```
GET  /todo/my?x-user-id=1        # 获取我的待办
POST /rental/                    # 创建预约
PATCH /rental/{id}/status        # 确认取件/归还
```

### 2. 器材管理员 (EQUIPMENT_ADMIN)
**主要职责**: 审核预约、器材状态管理

**待办事项触发场景**:
- 新预约创建 → 审核预约
- 器材归还 → 检查器材状态

**主要接口**:
```
GET  /todo/my?x-user-id=3        # 获取我的待办
PATCH /rental/{id}/status        # 确认/取消预约
GET  /equipment/                 # 器材列表管理
POST /maintenance/               # 创建维修记录
```

### 3. 财务 (FINANCE)
**主要职责**: 押金冻结确认、押金退还处理

**待办事项触发场景**:
- 预约确认 → 冻结押金
- 器材归还 → 退还押金

**主要接口**:
```
GET  /todo/my?x-user-id=5        # 获取我的待办
GET  /finance/deposit-review     # 押金冻结回看列表
PATCH /rental/{id}/status        # 押金状态变更
```

---

## 四、状态流转时间线

```
客户到店/电话预约
    ↓
[PENDING] 待审核 (门店店员创建) → 推送待办给【器材管理员】
    ↓ 器材管理员审核
[CONFIRMED] 已确认 → 推送待办给【财务】
    ↓ 财务确认冻结押金
[DEPOSIT_FROZEN] 押金已冻结 → 推送待办给【门店店员】
    ↓ 客户取件
[PICKED_UP] 已取件
    ↓ 客户归还
[RETURNED] 已归还 → 推送待办给【财务】
    ↓ 财务退还押金
[DEPOSIT_REFUNDED] 押金已退还  /  [DEPOSIT_DEDUCTED] 押金已扣除
```

---

## 五、暂未实现的集成点

### 1. 支付系统集成
- **当前状态**: 仅记录押金冻结/退还状态
- **需要集成**: 
  - 微信/支付宝押金冻结接口
  - 押金解冻/扣除接口
  - 租金在线支付
- **相关文件**: [app/crud.py](file:///Users/liu/Documents/private/model-test/trae-20260601-3/app/crud.py#L109-L168) `change_rental_status` 函数

### 2. 用户认证与权限控制
- **当前状态**: 通过 Header `x-user-id` 简单传递用户ID
- **需要实现**:
  - JWT Token 认证
  - 基于角色的接口权限校验
  - 用户登录/登出
- **相关文件**: [app/routers/](file:///Users/liu/Documents/private/model-test/trae-20260601-3/app/routers)

### 3. 短信/消息通知
- **当前状态**: 仅在系统内生成待办
- **需要实现**:
  - 客户预约确认短信
  - 押金冻结成功通知
  - 待办事项推送
- **触发点**: `crud.py` 中 `create_todo_for_role` 函数

### 4. 身份证信息识别
- **当前状态**: 手动输入客户身份证号
- **需要集成**:
  - OCR 身份证识别
  - 人脸核验

### 5. 器材图片上传
- **当前状态**: 仅文字描述
- **需要实现**:
  - 器材图片上传接口
  - 归还时损坏图片留存

### 6. 统计报表
- **当前状态**: 仅基础列表查询
- **需要实现**:
  - 月度营收统计
  - 器材利用率分析
  - 押金流水报表

### 7. 多门店支持
- **当前状态**: 单门店数据
- **需要实现**:
  - 门店字段
  - 跨门店器材调度
  - 门店数据隔离

---

## 六、快速开始

### 启动服务
```bash
chmod +x run.sh
./run.sh
```

### 访问接口文档
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 测试流程示例
```bash
# 1. 获取器材管理员待办 (使用用户ID 3)
curl -H "x-user-id: 3" http://localhost:8000/todo/my

# 2. 确认一条预约 (状态变更为 confirmed)
curl -X PATCH -H "x-user-id: 3" -H "Content-Type: application/json" \
  -d '{"new_status": "confirmed", "remark": "器材可用，确认预约"}' \
  http://localhost:8000/rental/1/status

# 3. 查看财务待办 (使用用户ID 5)
curl -H "x-user-id: 5" http://localhost:8000/todo/my
```

---

## 七、核心数据模型

### RentalRecord (租赁记录)
所有信息在单条记录中，包括：
- **预约信息**: 客户信息、器材、起止时间
- **押金信息**: 押金金额、冻结时间、冻结人、退还时间、退还人、退还原因
- **状态流转**: 当前状态、创建人、确认人、取件人、归还人
- **备注信息**: 归还备注、补充备注
- **时间追踪**: 创建时间、更新时间

### StatusHistory (状态历史)
每次状态变更都记录：
- 从什么状态 → 到什么状态
- 谁操作的、什么时候
- 操作备注

### TodoItem (待办事项)
- 按角色生成待办
- 关联租赁记录
- 完成状态追踪
