## 1. 架构设计

- 前端：Nuxt 3 (Vue 3) + Tailwind CSS + Pinia
- 后端：Nitro (Nuxt 内置服务器引擎)
- 数据库：SQLite (better-sqlite3)

## 2. 路由

| 路由 | 用途 |
|------|------|
| /login | 演示账号登录 |
| /dashboard | 工作台首页 |
| /patrols | 巡查管理列表 |
| /patrols/new | 新建巡查 |
| /patrols/:id | 巡查详情 |
| /risks | 风险上报列表 |
| /risks/new | 新建风险上报 |
| /risks/:id | 风险详情 |
| /settings | 系统管理 |

## 3. API

- POST /api/auth/login, GET /api/auth/me
- GET/POST /api/patrols, GET/PUT /api/patrols/:id, PUT /api/patrols/:id/complete, PUT /api/patrols/:id/archive
- GET/POST /api/risks, GET/PUT /api/risks/:id, PUT /api/risks/:id/reject, PUT /api/risks/:id/resubmit, PUT /api/risks/:id/approve, PUT /api/risks/:id/archive
- GET /api/todos, GET /api/trails, POST /api/system/reset, GET /api/system/demo-accounts

## 4. 数据模型

- users: id, name, role
- trails: id, name, difficulty, status
- patrols: id, trail_id, creator_id, type, status, result, conclusion, created_at, completed_at, archived_at
- risks: id, patrol_id, level, description, urgency, status, reject_reason, supplement_note, approve_action, approve_note, created_at, resolved_at, archived_at
- audit_logs: id, entity_type, entity_id, action, operator_id, detail, created_at
