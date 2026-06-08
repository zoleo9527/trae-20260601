# 旅游地接社 - 团队行程与资源确认

## 业务背景

计调编排行程、导游带团、车队调度排班——三方各有各的系统，但「行程定了资源到底确认没确认」说不清。本系统不做大而全的协作表，而是把**团队行程**和**资源确认**拆成两个独立工作面，每个工作面只暴露该角色最常用的动作，详情页可回看完整操作历史。

## 核心设计

- **行程与确认分离**：计调管行程（创建/修改/提交/撤回），资源方管确认（确认/驳回/修订/补充材料/备注）
- **确认工作面聚合**：资源确认详情页同时呈现所属行程摘要、上一环节结论、材料清单和备注，无需跳转
- **操作可追溯**：所有动作写入审计日志，按实体回看历史

## 快速启动

```bash
go run main.go
# 服务监听 :3000
```

## 接口一览

### 团队行程 `/api/v1/itineraries`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 创建行程（草稿） |
| GET | `/` | 列表（?status=draft&offset=0&limit=20） |
| GET | `/:id` | 详情（含 confirmation_progress） |
| PUT | `/:id` | 修改（仅草稿） |
| POST | `/:id/submit` | 提交 |
| POST | `/:id/withdraw` | 撤回（仅已提交） |
| GET | `/:id/audit` | 操作历史 |

### 资源确认 `/api/v1/confirmations`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 创建确认单（自动带入行程摘要+上一环节结论） |
| GET | `/` | 列表（?itinerary_id=&status=&resource_type=&created_from=&created_to=&offset=0&limit=20） |
| GET | `/:id` | 详情（含行程摘要、材料、备注、上一环节结论） |
| POST | `/:id/confirm` | 确认通过 |
| POST | `/:id/reject` | 确认驳回 |
| POST | `/:id/revise` | 修订后重新提交（仅已驳回） |
| POST | `/:id/materials` | 补充材料 |
| POST | `/:id/notes` | 添加备注 |
| GET | `/:id/audit` | 操作历史 |

### 导出任务 `/api/v1/exports`

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/` | 创建导出任务 |
| GET | `/:id` | 查询导出状态 |
| GET | `/:id/download` | 下载导出文件 |

## 错误码

| 错误码 | 含义 |
|--------|------|
| 0 | 成功 |
| 40000 | 请求参数错误 |
| 40100 | 未授权 |
| 40300 | 无权限 |
| 40400 | 资源不存在 |
| 40401 | 行程不存在 |
| 40402 | 资源确认不存在 |
| 40403 | 导出任务不存在 |
| 40900 | 状态冲突 |
| 40901 | 行程非草稿，不可修改 |
| 40902 | 行程非已提交，不可撤回 |
| 40903 | 资源确认非待确认状态 |
| 50000 | 内部错误 |
| 50001 | 导出失败 |

## 行程详情新增字段

`GET /api/v1/itineraries/:id` 响应体从直接返回行程对象改为包含 `confirmation_progress`：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "itinerary": { "id": "...", "team_name": "...", "..." : "..." },
    "confirmation_progress": {
      "pending_count": 2,
      "confirmed_count": 1,
      "rejected_count": 1,
      "revised_count": 0,
      "unconfirmed_list": [
        {
          "id": "cf-xxx",
          "resource_type": "vehicle",
          "resource_name": "45座大巴-川A12345",
          "resource_ref": "FLEET-001",
          "status": "pending"
        }
      ],
      "latest_reject_reason": "确认驳回: 车辆年检过期"
    }
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `confirmation_progress.pending_count` | int | 待确认数量 |
| `confirmation_progress.confirmed_count` | int | 已确认数量 |
| `confirmation_progress.rejected_count` | int | 已驳回数量 |
| `confirmation_progress.revised_count` | int | 已修订数量 |
| `confirmation_progress.unconfirmed_list` | array | 待确认 + 已修订的资源清单 |
| `confirmation_progress.latest_reject_reason` | string | 最近一次驳回的审计摘要，无驳回时为空 |

## 确认列表新增查询参数

`GET /api/v1/confirmations` 新增以下查询参数（与原有 `itinerary_id`、`status`、`offset`、`limit` 兼容）：

| 参数 | 类型 | 说明 |
|------|------|------|
| `resource_type` | string | 按资源类型过滤，如 `vehicle`、`hotel` |
| `created_from` | RFC3339 | 创建时间起始（含），如 `2026-06-01T00:00:00Z` |
| `created_to` | RFC3339 | 创建时间截止（含），如 `2026-06-30T23:59:59Z` |

当 `created_from` / `created_to` 格式不符合 RFC3339 时返回 `40000` 错误码。

## 请求示例

### 创建行程

```bash
curl -X POST http://localhost:3000/api/v1/itineraries \
  -H "Content-Type: application/json" \
  -H "X-User-ID: u001" \
  -H "X-User-Name: 张计调" \
  -d '{
    "team_name": "九寨沟5日团",
    "team_code": "JZG-20260608-01",
    "guide_name": "李导",
    "guide_phone": "13800138000",
    "days": 5,
    "start_date": "2026-06-15",
    "end_date": "2026-06-19",
    "route_summary": "成都-九寨沟-黄龙-成都",
    "items": [
      {"date":"2026-06-15","activity":"成都接机入住","hotel_name":"XX酒店","meal_plan":"晚","transport":"大巴"},
      {"date":"2026-06-16","activity":"九寨沟全天游览","hotel_name":"XX酒店","meal_plan":"早中晚","transport":"大巴"}
    ]
  }'
```

### 提交行程

```bash
curl -X POST http://localhost:3000/api/v1/itineraries/{id}/submit \
  -H "X-User-ID: u001" -H "X-User-Name: 张计调"
```

### 创建资源确认

```bash
curl -X POST http://localhost:3000/api/v1/confirmations \
  -H "Content-Type: application/json" \
  -H "X-User-ID: u002" -H "X-User-Name: 王车队" \
  -d '{
    "itinerary_id": "{行程ID}",
    "resource_type": "vehicle",
    "resource_name": "45座大巴-川A12345",
    "resource_ref": "FLEET-001"
  }'
```

### 补充材料

```bash
curl -X POST http://localhost:3000/api/v1/confirmations/{id}/materials \
  -H "Content-Type: application/json" \
  -H "X-User-ID: u002" -H "X-User-Name: 王车队" \
  -d '{
    "category": "车辆资质",
    "title": "营运证扫描件",
    "description": "45座大巴营运证有效期至2027年",
    "attachments": [
      {"id":"att001","file_name":"营运证.pdf","file_size":204800,"mime_type":"application/pdf","upload_url":"/uploads/营运证.pdf"}
    ]
  }'
```

### 添加备注

```bash
curl -X POST http://localhost:3000/api/v1/confirmations/{id}/notes \
  -H "Content-Type: application/json" \
  -H "X-User-ID: u003" -H "X-User-Name: 赵酒店" \
  -d '{"content": "已和酒店方确认6月15-16日房源，需在6月12日前付定金"}'
```

### 确认通过

```bash
curl -X POST http://localhost:3000/api/v1/confirmations/{id}/confirm \
  -H "X-User-ID: u002" -H "X-User-Name: 王车队"
```

### 导出行程

```bash
curl -X POST http://localhost:3000/api/v1/exports \
  -H "Content-Type: application/json" \
  -H "X-User-ID: u001" -H "X-User-Name: 张计调" \
  -d '{"type":"itinerary","format":"pdf","source_id":"{行程ID}"}'
```

### 查询导出状态

```bash
curl http://localhost:3000/api/v1/exports/{id}
```

### 按资源类型和时间区间查询确认单

```bash
curl "http://localhost:3000/api/v1/confirmations?resource_type=vehicle&created_from=2026-06-01T00:00:00Z&created_to=2026-06-30T23:59:59Z&offset=0&limit=10"
```

### 查看行程详情（含确认进度）

```bash
curl http://localhost:3000/api/v1/itineraries/{id}
```

## 被模拟的能力

以下能力在后端以占位方式实现，实际部署需对接真实服务：

### 导出

- 当前 `POST /exports` 创建任务后异步模拟 2 秒完成，`download_url` 为虚拟路径
- 实际部署需替换为：PDF 生成（如 wkhtmltopdf / go-pdf）、Excel 生成（如 excelize）、OSS 上传

### 附件上传

- 材料中的 `attachments` 字段已定义完整结构（`id / file_name / file_size / mime_type / upload_url`），但上传接口未实现
- 实际部署需补充：`POST /api/v1/uploads` → 返回 `upload_url`，前端先上传拿到 URL 再写入材料

### 用户认证

- 当前通过 `X-User-ID` / `X-User-Name` 请求头传入，无鉴权
- 实际部署需替换为 JWT / Session 中间件

### 持久化

- 当前使用内存 Store（`store/store.go`），重启即丢失
- 实际部署需替换为数据库（推荐 PostgreSQL + GORM）
