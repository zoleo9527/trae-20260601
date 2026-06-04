# 体检中心 - 异常指标与复查建议系统

异常指标出来后，谁通知、谁解释、谁安排复查，系统里全程留痕。三个角色（导检、医生、审核员）各有独立入口，关注点分离。

## 快速启动

```bash
cd checkup_center
python3 -m venv venv
source venv/bin/activate
pip install fastapi uvicorn sqlalchemy pydantic

# 初始化数据库 + 样例数据
python -m app.init_data

# 启动服务
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

启动后访问：
- API 文档：http://localhost:8000/docs
- 系统概览：http://localhost:8000/

## 样例数据说明

| 患者 | 场景 | 当前状态 |
|------|------|----------|
| 张三 | 漏检后补做 | B超漏检→导检已通知→尚未补做→血常规轻微异常→医生已给建议→报告草稿 |
| 李四 | 指标异常但未复查 | 血糖偏高+脂肪肝+白细胞偏高→医生给了2条建议(白细胞缺建议)→通知已发但未复查→报告草稿 |
| 王五 | 报告已审核待发放 | 甲状腺结节→医生已给建议→通知已确认→报告已审核待发放 |

用户数据：

| ID | 姓名 | 角色 | 部门 |
|----|------|------|------|
| 1  | 王导检 | guide | 前台导检 |
| 2  | 李医生 | doctor | 内科 |
| 3  | 赵医生 | doctor | 检验科 |
| 4  | 陈审核 | reviewer | 质控科 |

---

## 接口总览

| 角色 | 前缀 | 关注点 |
|------|------|--------|
| 导检人员 | `/api/guide/` | 今天哪些人没补检、通知发了没 |
| 科室医生 | `/api/doctor/` | 指标和建议是否匹配 |
| 报告审核员 | `/api/reviewer/` | 报告能不能发 |
| 通用 | `/api/` | 患者、体检记录、异常指标录入、通知查询 |

---

## 一、导检人员接口 (`/api/guide/`)

### 1.1 查看需要补检的人员

```bash
curl http://localhost:8000/api/guide/pending-checkups
```

返回示例：
```json
[
  {
    "record_id": 1,
    "patient_name": "张三",
    "patient_phone": "13800001111",
    "checkup_date": "2026-06-02",
    "missed_items": ["B超"],
    "notification_sent": true,
    "notification_status": "sent"
  }
]
```

### 1.2 通知漏检人员

> 说明：`type` 字段由系统自动设为 `"missed_item"`，无需传入。`sent_by` 为通知人员ID，返回结果自动带出 `sender_name`。

```bash
curl -X POST http://localhost:8000/api/guide/notify-missed \
  -H "Content-Type: application/json" \
  -d '{
    "record_id": 1,
    "patient_id": 1,
    "channel": "sms",
    "content": "张三您好，您的B超项目尚未完成，请尽快补做。",
    "sent_by": 1
  }'
```

返回示例：
```json
{
  "record_id": 1,
  "patient_id": 1,
  "type": "missed_item",
  "channel": "sms",
  "content": "张三您好，您的B超项目尚未完成，请尽快补做。",
  "id": 5,
  "status": "sent",
  "sent_by": 1,
  "sent_at": "2026-06-04T09:46:47.218045",
  "confirmed_at": null,
  "sender_name": "王导检"
}
```

### 1.3 安排补检

```bash
curl -X POST "http://localhost:8000/api/guide/arrange-recheck/3?operator_id=2"
```

返回示例：
```json
{
  "message": "已安排补检: B超",
  "item_id": 3,
  "new_status": "in_progress"
}
```

### 1.4 查看通知状态

```bash
# 所有通知
curl http://localhost:8000/api/guide/notification-status

# 按记录筛选
curl "http://localhost:8000/api/guide/notification-status?record_id=1"

# 按状态筛选（待发送的通知）
curl "http://localhost:8000/api/guide/notification-status?status=pending"
```

### 1.5 确认通知已送达

```bash
curl -X PUT http://localhost:8000/api/guide/confirm-notification/1
```

---

## 二、科室医生接口 (`/api/doctor/`)

### 2.1 查看异常指标（含建议情况）

```bash
# 全部异常指标
curl http://localhost:8000/api/doctor/abnormal-indicators

# 按体检记录筛选
curl "http://localhost:8000/api/doctor/abnormal-indicators?record_id=2"

# 按严重程度筛选
curl "http://localhost:8000/api/doctor/abnormal-indicators?severity=moderate"
```

返回示例：
```json
[
  {
    "id": 4,
    "indicator_name": "白细胞",
    "indicator_value": "12.5×10^9/L",
    "reference_range": "4.0-10.0×10^9/L",
    "severity": "mild",
    "patient_name": "李四",
    "item_name": "血常规",
    "has_recommendation": false,
    "recommendation_count": 0
  }
]
```

### 2.2 为异常指标添加复查建议

```bash
curl -X POST http://localhost:8000/api/doctor/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "indicator_id": 4,
    "record_id": 2,
    "recommendation": "1周后复查血常规，如持续偏高建议血液科就诊",
    "follow_up_type": "recheck",
    "deadline": "2026-06-18",
    "created_by": 2
  }'
```

### 2.3 修改复查建议

```bash
curl -X PUT http://localhost:8000/api/doctor/recommendations/1 \
  -H "Content-Type: application/json" \
  -d '{
    "recommendation": "3个月后复查血常规及网织红细胞计数",
    "deadline": "2026-09-04"
  }'
```

### 2.4 校验异常指标与复查建议是否匹配

```bash
# 全部指标
curl http://localhost:8000/api/doctor/indicator-recommendation-match

# 某条体检记录
curl "http://localhost:8000/api/doctor/indicator-recommendation-match?record_id=2"
```

返回示例：
```json
[
  {
    "indicator_id": 4,
    "indicator_name": "白细胞",
    "severity": "mild",
    "has_recommendation": false,
    "recommendation_count": 0,
    "is_completed": false,
    "match_status": "missing"
  }
]
```

`match_status` 取值：
- `missing`：异常指标没有复查建议（**需要医生补充**）
- `pending`：有建议但未完成复查
- `completed`：已复查完成

### 2.5 查看复查建议列表

```bash
curl "http://localhost:8000/api/doctor/recommendations?record_id=2"
```

---

## 三、报告审核员接口 (`/api/reviewer/`)

### 3.1 查看待审核报告

```bash
curl http://localhost:8000/api/reviewer/pending-reports
```

### 3.2 查看已审核待发放报告

```bash
curl http://localhost:8000/api/reviewer/approved-reports
```

### 3.3 审核报告（通过或驳回）

```bash
# 通过
curl -X PUT http://localhost:8000/api/reviewer/review-report/2 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approve",
    "reviewer_id": 4,
    "comment": "所有项目已完成，异常指标均有复查建议，可以发放。"
  }'

# 驳回（如发现还有指标缺建议）
curl -X PUT http://localhost:8000/api/reviewer/review-report/2 \
  -H "Content-Type: application/json" \
  -d '{
    "action": "reject",
    "reviewer_id": 4,
    "comment": "白细胞偏高缺复查建议，请医生补充后再审核。"
  }'
```

### 3.4 发放报告

```bash
curl -X PUT http://localhost:8000/api/reviewer/release-report/3 \
  -H "Content-Type: application/json" \
  -d '{"releaser_id": 4}'
```

> 只有 `approved` 状态的报告才能发放，发放后状态变为 `released`。

### 3.5 查看报告完整详情

```bash
curl http://localhost:8000/api/reviewer/report-detail/3
```

返回包含：
- 报告基本信息及审核/发放状态
- 患者姓名、体检日期
- 所有异常指标及复查建议
- **校验字段**：`all_items_completed`（所有项目是否完成）、`all_indicators_have_recommendations`（所有异常指标是否有复查建议）

### 3.6 查看所有报告

```bash
curl http://localhost:8000/api/reviewer/all-reports
```

---

## 四、通用接口 (`/api/`)

### 4.1 患者管理

```bash
# 创建患者
curl -X POST http://localhost:8000/api/patients \
  -H "Content-Type: application/json" \
  -d '{"name": "赵六", "gender": "男", "age": 60, "phone": "13800004444", "id_number": "310101196501044567"}'

# 患者列表
curl http://localhost:8000/api/patients

# 患者详情
curl http://localhost:8000/api/patients/1
```

### 4.2 体检记录

```bash
# 创建体检记录
curl -X POST http://localhost:8000/api/checkup-records \
  -H "Content-Type: application/json" \
  -d '{"patient_id": 4, "checkup_date": "2026-06-04", "status": "pending"}'

# 体检记录列表
curl http://localhost:8000/api/checkup-records

# 按患者筛选
curl "http://localhost:8000/api/checkup-records?patient_id=1"

# 体检记录详情（含项目列表）
curl http://localhost:8000/api/checkup-records/1

# 更新体检记录状态
curl -X PUT "http://localhost:8000/api/checkup-records/1/status?status=completed"
```

### 4.3 录入异常指标

```bash
curl -X POST http://localhost:8000/api/abnormal-indicators \
  -H "Content-Type: application/json" \
  -d '{
    "item_id": 1,
    "record_id": 1,
    "indicator_name": "血红蛋白",
    "indicator_value": "162 g/L",
    "reference_range": "120-160 g/L",
    "severity": "mild"
  }'
```

### 4.4 通知查询

```bash
# 全部通知
curl http://localhost:8000/api/notifications

# 按患者
curl "http://localhost:8000/api/notifications?patient_id=2"

# 按类型
curl "http://localhost:8000/api/notifications?type=missed_item"

# 按状态
curl "http://localhost:8000/api/notifications?status=pending"
```

### 4.5 用户列表

```bash
curl http://localhost:8000/api/users
```

---

## 数据模型

```
Patient ──1:N──> CheckupRecord ──1:N──> CheckupItem
                    │                      │
                    ├──1:N──> AbnormalIndicator ──1:N──> FollowUpRecommendation
                    ├──1:1──> Report
                    └──1:N──> Notification
```

报告状态流转：`draft` → `approved`/`rejected` → `released`

通知类型：`missed_item`（漏检）、`abnormal_indicator`（异常指标）、`follow_up`（复查提醒）

复查建议类型：`recheck`（复查）、`specialist`（专科就诊）、`lifestyle`（生活方式调整）
