# 写字楼租赁房源管理系统

房源空置与带看安排管理系统，实现一线处理和管理回看基于同一份数据，所有操作可追溯。

## 技术栈

- **后端**: FastAPI + SQLAlchemy + SQLite
- **前端**: Vue 3 + Vite + Element Plus + Pinia
- **认证**: JWT Token

## 项目结构

```
├── backend/                 # 后端服务
│   ├── app/
│   │   ├── routers/         # API路由
│   │   │   ├── auth.py      # 认证接口
│   │   │   ├── properties.py # 房源接口
│   │   │   ├── viewings.py  # 带看接口
│   │   │   ├── exceptions.py # 异常接口
│   │   │   └── attachments.py # 附件接口
│   │   ├── models.py        # 数据模型
│   │   ├── schemas.py       # Pydantic模式
│   │   ├── auth.py          # 认证工具
│   │   └── database.py      # 数据库连接
│   ├── main.py              # 应用入口
│   ├── init_data.py         # 初始化数据
│   └── requirements.txt     # 依赖
├── frontend/                # 前端应用
│   ├── src/
│   │   ├── views/           # 页面
│   │   │   ├── Login.vue     # 登录页
│   │   │   ├── Layout.vue    # 布局
│   │   │   ├── PropertyList.vue # 房源列表
│   │   │   ├── ViewingList.vue  # 带看列表
│   │   │   └── ExceptionList.vue # 异常列表
│   │   ├── components/      # 组件
│   │   │   ├── StatusTag.vue
│   │   │   ├── TimelinePanel.vue    # 操作追溯时间线
│   │   │   ├── VacancyDialog.vue    # 空置处理弹窗
│   │   │   ├── ViewingDialog.vue    # 带看安排弹窗
│   │   │   ├── ExceptionDrawer.vue  # 异常处理抽屉
│   │   │   ├── AttachmentPanel.vue  # 附件管理
│   │   │   └── PropertyDetailDrawer.vue # 房源详情
│   │   ├── stores/          # 状态管理
│   │   ├── utils/           # 工具函数
│   │   └── router/          # 路由
│   └── package.json
└── README.md
```

## 核心功能

### 1. 房源空置处理
- 记录空置原因、空置日期、预计可租日期
- 处理备注会同步到带看安排页面，供后续带看人员参考
- 所有状态变更自动记录操作日志

### 2. 带看安排
- 新增带看时自动显示房源备注信息
- 记录客户信息、带看时间、意向程度
- 带看结果反馈和跟进计划
- 可关联异常上报

### 3. 异常处理抽屉
- 快速上报异常，可关联房源或带看记录
- 支持不同严重程度和异常类型
- 处理过程全程记录，解决方案可追溯

### 4. 操作追溯（时间线）
- 房源、带看、异常的所有操作都有完整日志
- 记录状态变化、责任人、时间点、备注
- 一线处理和管理回看基于同一份数据

### 5. 附件占位
- 支持为房源、带看、异常添加附件占位
- 记录文件名、类型、大小、备注
- 预留文件上传接口

## 数据模型设计

### 核心表
1. **users** - 用户表（简化登录）
2. **properties** - 房源表（含空置状态、备注等）
3. **viewings** - 带看记录表（关联房源、客户信息）
4. **exceptions** - 异常记录表（可关联房源或带看）
5. **attachments** - 附件表（支持占位和实际上传）
6. **operation_logs** - 操作日志表（所有状态变更、责任人、时间点）

## 快速开始

### 启动后端服务

```bash
cd backend
chmod +x start.sh
./start.sh
```

或手动执行：

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python init_data.py  # 初始化数据库和示例数据
python -m uvicorn main:app --reload --port 8000
```

后端服务地址: http://localhost:8000
API文档: http://localhost:8000/docs

### 启动前端服务

```bash
cd frontend
chmod +x start.sh
./start.sh
```

或手动执行：

```bash
cd frontend
npm install
npm run dev
```

前端服务地址: http://localhost:5173

## 测试账号

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin | admin123 | 管理员 |
| zhangsan | 123456 | 员工（张三） |
| lisi | 123456 | 员工（李四） |

## 示例数据说明

初始化脚本会创建以下示例数据：
- 5条房源（不同空置状态）
- 5条带看记录（含待带看和已完成）
- 4条异常记录（不同处理状态）
- 4个附件占位
- 5条操作日志示例

## 关键设计说明

### 数据可追溯
- 所有写操作（创建、更新、状态变更）都会写入 `operation_logs` 表
- 记录字段包括：操作类型、旧值、新值、备注、操作人ID、操作人姓名、时间戳
- 房源时间线会聚合显示：房源本身的操作 + 关联带看的操作 + 关联异常的操作

### 备注信息流转
- 房源空置处理时填写的 `remarks` 字段，在创建带看时会自动显示在房源选择下拉框和详情页面
- 带看人员在安排带看和实际带看时都能看到之前的处理备注
- 实现了"房源空置处理时的备注要能被带看安排继续使用"的需求

### 一线和管理数据统一
- 所有数据都存储在数据库中，不是写死在页面
- 同一套API接口服务于一线操作和管理查询
- 操作日志确保所有行为可审计

## API 接口列表

### 认证
- `POST /api/auth/login` - 登录
- `GET /api/auth/me` - 获取当前用户

### 房源
- `GET /api/properties` - 房源列表
- `POST /api/properties` - 新增房源
- `GET /api/properties/{id}` - 房源详情
- `PUT /api/properties/{id}` - 更新房源
- `PUT /api/properties/{id}/vacancy` - 空置处理
- `GET /api/properties/{id}/timeline` - 房源操作时间线

### 带看
- `GET /api/viewings` - 带看列表
- `POST /api/viewings` - 新增带看
- `GET /api/viewings/{id}` - 带看详情
- `PUT /api/viewings/{id}` - 更新带看
- `GET /api/viewings/{id}/timeline` - 带看操作时间线

### 异常
- `GET /api/exceptions` - 异常列表
- `POST /api/exceptions` - 新增异常
- `GET /api/exceptions/{id}` - 异常详情
- `PUT /api/exceptions/{id}` - 处理异常
- `GET /api/exceptions/{id}/timeline` - 异常操作时间线

### 附件
- `GET /api/attachments` - 附件列表
- `POST /api/attachments` - 添加附件占位
- `POST /api/attachments/upload` - 上传附件
- `DELETE /api/attachments/{id}` - 删除附件
