# 摄影器材租赁 - 出库验机与归还复核系统

## 核心设计理念

解决的核心问题：**出库验机和归还复核之间责任说不清**。

通过以下方式确保一线处理和管理回看基于同一份数据：
1. 所有状态变化完整记录操作人、时间、备注和附件
2. 出库验机时标记「关键判断」，归还复核时自动展示作为对比基准
3. 异常情况自动对比出库和归还状态差异
4. 全链路历史记录可追溯

---

## 一、角色入口

系统支持三种角色，可在左下角或工作台切换：

### 1. 一线操作员 (frontline)
**主要职责：** 出库验机、归还复核

**入口路径：**
- 首页 → 工作台 → 待处理事项
- 侧边栏 → 出库验机 → 待验机
- 侧边栏 → 归还复核 → 待复核

**权限：**
- `outbound:inspect` - 执行出库验机
- `outbound:view` - 查看出库记录
- `return:review` - 执行归还复核
- `return:view` - 查看归还记录
- `history:view` - 查看历史记录
- `batch:process` - 执行批量操作

### 2. 门店经理 (manager)
**主要职责：** 查看所有记录、处理异常、审批批量操作、管理押金退还

**入口路径：**
- 侧边栏 → 历史记录 - 全链路追溯
- 异常订单详情页 - 「处理异常」按钮
- 侧边栏 → 批量处理 - 批量结案

**权限：**
- `outbound:view` - 查看出库记录
- `return:view` - 查看归还记录
- `history:view` - 查看历史记录
- `history:export` - 导出记录
- `batch:process` - 执行批量操作
- `batch:approve` - 审批批量操作
- `anomaly:handle` - 处理异常
- `repair:manage` - 管理维修
- `deposit:refund` - 退还押金

### 3. 系统管理员 (admin)
**所有权限**

---

## 二、模拟数据位置

所有模拟数据位于 [mockData.js](file:///Users/liu/Documents/private/model-test/trae-20260601-5/src/data/mockData.js)

### 2.1 核心数据

| 数据类型 | 变量名 | 说明 |
|---------|--------|------|
| 状态流转 | `STATUS_FLOW` | 10种状态定义 |
| 状态标签 | `STATUS_LABELS` | 状态显示名称和类型 |
| 验机项目 | `INSPECTION_ITEMS` | 7项检查内容 |
| 异常类型 | `ABNORMAL_TYPES` | 7种异常，分3个严重等级 |
| 租赁订单 | `mockRentals` | 6条示例订单，覆盖各种状态 |
| 押金记录 | `mockDeposits` | 3条押金支付记录 |
| 维修记录 | `mockRepairRecords` | 1条维修中记录 |
| 角色定义 | `ROLES` | 3种角色及其权限 |
| 集成点说明 | `INTEGRATION_POINTS` | 6个待集成点 |

### 2.2 示例订单说明

| 订单ID | 器材 | 当前状态 | 说明 |
|-------|------|---------|------|
| RT20260603001 | Sony A7M4 | 待出库验机 | 新订单，可开始验机 |
| RT20260603002 | Canon 24-70mm | 租赁中 | 已完成出库验机，镜身有轻微划痕（关键判断） |
| RT20260603003 | DJI Ronin-S | 待归还复核 | 客户已预约归还，可开始复核，可回看验机关键判断 |
| RT20260603004 | Nikon Z6 II | 异常待处理 | 归还时发现LCD划痕和传感器污点，与出库状态不一致 |
| RT20260603005 | Sony 70-200mm | 已结案 | 完整流程：出库→租赁→归还→押金退还→结案 |
| RT20260603006 | Canon EOS R5 | 维修中 | 卡口断裂，已送修，客户确认承担费用 |

### 2.3 状态管理

状态逻辑位于 [equipment.js](file:///Users/liu/Documents/private/model-test/trae-20260601-5/src/stores/equipment.js)

**状态流转图：**
```
待出库验机 → 验机中 → 已出库 → 租赁中 → 待归还复核 → 复核中 → 已完成 → 已结案
                                                              ↓
                                                          异常待处理 → 维修中
```

**关键方法：**
- `changeStatus()` - 记录每一次状态变化
- `completeOutboundInspection()` - 完成出库验机，自动流转状态
- `completeReturnInspection()` - 完成归还复核，有异常自动标记
- `compareInspections()` - 自动对比出库和归还差异
- `handleAnomaly()` - 处理异常（送修或结案）

---

## 三、暂未实现的集成点

| ID | 名称 | 说明 | 模拟数据位置 |
|----|------|------|-------------|
| INT001 | 押金系统集成 | 对接微信/支付宝支付系统，自动获取押金支付凭证 | `mockDeposits` |
| INT002 | 维修系统集成 | 对接维修管理系统，同步维修进度和费用 | `mockRepairRecords` |
| INT003 | 订单系统集成 | 对接租赁订单系统，自动同步订单信息 | `mockRentals` |
| INT004 | 电子签名集成 | 对接电子签名系统，客户确认时生成法律效力签名 | `signature` 字段 |
| INT005 | 短信通知集成 | 状态变化时自动通知客户和经办人 | `statusChange` 动作 |
| INT006 | 图片存储集成 | 验机照片上传至对象存储服务（OSS/COS） | 照片上传区域 |

---

## 四、核心功能说明

### 4.1 出库验机

**页面：** [InspectForm.vue](file:///Users/liu/Documents/private/model-test/trae-20260601-5/src/views/outbound/InspectForm.vue)

**核心特性：**
- 7项检查内容，每项可标记为「关键判断」
- 支持拍照留证
- 异常时自动标记严重等级
- 客户确认环节（电子签名待集成）
- 右侧实时预览已标记的关键判断

### 4.2 归还复核

**页面：** [ReviewForm.vue](file:///Users/liu/Documents/private/model-test/trae-20260601-5/src/views/return/ReviewForm.vue)

**核心特性：**
- ✅ 顶部展示出库验机关键判断（含照片），作为对比基准
- 每项检查与出库状态并排对比，不一致自动高亮
- 实时显示对比结果摘要
- 异常时需填写异常报告（类型、预估费用、待处理事项）
- 押金冻结状态提示

### 4.3 历史记录

**页面：** [HistoryDetail.vue](file:///Users/liu/Documents/private/model-test/trae-20260601-5/src/views/HistoryDetail.vue)

**核心特性：**
- 完整的状态流转时间线
- 出库验机和归还复核记录并排展示
- 异常和维修记录完整呈现
- 押金信息和操作日志
- 经理可在此页面处理异常、完成维修、结案

### 4.4 批量处理

**页面：** [BatchAction.vue](file:///Users/liu/Documents/private/model-test/trae-20260601-5/src/views/BatchAction.vue)

**支持操作：**
- 批量开始出库验机
- 批量开始归还复核
- 批量结案（需经理权限）

---

## 五、快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

**访问地址：** http://localhost:5173

**建议测试路径：**

1. 一线操作员：工作台 → 待出库验机 → 点击「去验机」→ 填写验机内容 → 标记关键判断 → 完成
2. 一线操作员：待归还复核 → 点击「去复核」→ 查看顶部出库关键判断 → 逐项对比 → 如有异常填写异常报告
3. 门店经理：历史记录 → 点击订单号进入详情 → 查看完整链路 → 处理异常订单
4. 测试批量功能：侧边栏 → 批量处理 → 选择操作 → 选择订单 → 执行
