# 鲜花配送站 - 订单制作与花艺质检系统

## 启动方式

```bash
cd aesthetic_center
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

启动后访问：
- API 文档：http://localhost:8001/docs
- 健康检查：http://localhost:8001/health

## 数据重置方式

删除数据库文件后重启服务即可自动重建并填充种子数据：

```bash
rm -f florist.db
# 重启 uvicorn 即自动 init_db + seed_db
```

## 认证方式

本系统通过请求头 `X-User-Id` 传递当前用户 ID，模拟登录态。

种子用户：

| ID | 用户名 | 角色 | 说明 |
|----|--------|------|------|
| 1 | admin | admin | 管理员，全部权限 |
| 2 | florist_zhang | florist | 花艺师张，可创建/制作订单 |
| 3 | florist_li | florist | 花艺师李，可创建/制作订单 |
| 4 | inspector_wang | inspector | 质检员王，可执行质检、标注异常 |
| 5 | delivery_chen | delivery | 配送员陈，可更新配送状态 |

请求示例：
```bash
curl -H "X-User-Id: 2" http://localhost:8001/orders
```

## 数据模型关系

```
User 1──N Order          （用户创建订单）
User 1──N QualityInspection （质检员执行质检）
User 1──N AnomalyRecord （用户创建/处理异常）

Order 1──N OrderItem        （订单包含花材明细）
Order 1──N QualityInspection（订单可多次质检）
Order 1──N AnomalyRecord    （订单可有多条异常记录）

OrderItem N──1 FlowerMaterial（明细关联花材主数据）
QualityInspection 1──N AnomalyRecord（质检可触发异常）
```

## 订单状态流转

```
pending → in_production → produced → inspecting
                                            │
                              ┌─────────────┤
                              ↓             ↓
                           passed        rework
                              │             │
                              ↓             ↓
                          delivering → in_production（重新制作）
                              │
                              ↓
                          delivered
```

合法状态转换表（`VALID_TRANSITIONS`）：
- `pending` → `in_production`
- `in_production` → `produced`
- `produced` → `inspecting`
- `inspecting` → `passed` | `rework`
- `rework` → `in_production`
- `passed` → `delivering`
- `delivering` → `delivered`

## 自动异常标注规则

| 异常类型 | 触发时机 | 说明 |
|---------|---------|------|
| `material_substitution_unexplained` | 创建订单/标记替换时，花材被替换但 `substitution_reason` 为空 | 花材替换没说明 |
| `delivery_timeout` | 订单标记 `delivered` 时，`actual_delivery_time > promised_delivery_time` | 配送超时 |
| `card_error` | 质检时 `card_text_correct = False` | 贺卡写错 |

## 权限矩阵

| 操作 | admin | florist | inspector | delivery |
|------|-------|---------|-----------|----------|
| 创建订单 | ✅ | ✅ | ❌ | ❌ |
| 修改花材替换 | ✅ | ✅ | ❌ | ❌ |
| 确认贺卡 | ✅ | ✅ | ❌ | ❌ |
| 更新订单状态 | ✅* | ✅** | ❌ | ✅*** |
| 执行质检 | ✅ | ❌ | ✅ | ❌ |
| 标注异常 | ✅ | ❌ | ✅ | ❌ |
| 确认异常 | ✅ | ✅ | ✅ | ✅ |
| 解决异常 | ✅ | ❌ | ❌ | ❌ |

\* 管理员可更新任意状态
\*\* 花艺师可更新制作相关状态
\*\*\* 配送员可更新配送相关状态

## 错误码

| 错误码 | 含义 |
|-------|------|
| 1000 | 未知错误 |
| 1001 | 参数无效 |
| 1002 | 资源不存在 |
| 1003 | 资源已存在 |
| 2001 | 订单状态流转不合法 |
| 2002 | 无操作权限 |
| 3001 | 花材替换必须填写替换原因 |
| 3002 | 配送已超时 |
| 3003 | 贺卡内容与订单不符 |
| 3004 | 当前订单状态不允许质检 |
| 3005 | 订单至少需要一个花材明细 |
| 3006 | 异常记录已处理完结 |

## 模拟能力说明

以下能力为模拟实现，生产环境需替换为真实服务：

1. **用户认证**：通过 `X-User-Id` 请求头传递用户 ID，无密码校验、无 Token 机制
2. **配送追踪**：无 GPS/物流 API 对接，配送状态由人工调用接口更新
3. **花材库存**：`FlowerMaterial.is_available` 为标记字段，无实时库存扣减逻辑
4. **通知推送**：异常标注后无短信/邮件/消息推送，仅写入数据库
5. **贺卡校验**：`card_text_correct` 由质检员人工判断后提交，无 OCR 自动比对
