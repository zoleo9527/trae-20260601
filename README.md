# 母婴零售店-促销券发放与核销复核系统

## 项目简介

这是一个面向母婴零售店的促销券管理系统，实现了从券发放到核销复核的完整业务流程。

### 核心功能

1. **促销券发放处理** - 店员可新建发放，选择会员、政策，关联批号，填写备注
2. **核销复核** - 店长可复核店员提交的券，查看发放链路和备注历史
3. **状态流转** - 草稿 → 待复核 → 已发放 → 已核销 → 已归档
4. **多角色视图** - 店员、店长、采购各有不同的视图和权限
5. **首页仪表盘** - 待办任务、风险项预警、最近变更记录

## 技术栈

- **前端**: React 18 + Vite + TailwindCSS + TypeScript
- **后端**: Express 4 + TypeScript
- **数据库**: SQLite（文件数据库）
- **认证**: JWT

## 快速启动

### 1. 安装依赖

```bash
# 安装根目录依赖
npm install

# 或分别安装
cd frontend && npm install
cd backend && npm install
```

### 2. 启动后端服务器

```bash
cd backend
npm run dev
```

后端服务将在 http://localhost:3001 启动

### 3. 启动前端开发服务器

```bash
cd frontend
npm run dev
```

前端服务将在 http://localhost:5173 启动

### 4. 访问应用

打开浏览器访问 http://localhost:5173

## 测试账号

系统预置了以下测试账号（密码均为: 123456）：

| 用户名 | 角色 | 说明 |
|--------|------|------|
| clerk001 | 店员 | 旗舰店店员，可发放券 |
| manager001 | 店长 | 旗舰店店长，可复核券 |
| buyer001 | 采购 | 可查看批号追溯 |

## 功能说明

### 店员视角
- 新建促销券发放
- 查看本店券列表
- 上传附件
- 查看会员档案

### 店长视角
- 查看全店券列表
- 复核待审核的券
- 核销已发放的券
- 监控风险项

### 采购视角
- 查看所有批号
- 追溯批号关联的券
- 查看变更记录

## 数据库

SQLite数据库文件位于 `backend/data.db`，首次启动会自动初始化并插入测试数据。

## 项目结构

```
project-root/
├── frontend/                 # React前端
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── services/        # API调用
│   │   ├── stores/          # 状态管理
│   │   └── types/           # 类型定义
│   └── package.json
│
├── backend/                  # Express后端
│   ├── src/
│   │   ├── routes/          # 路由定义
│   │   ├── middlewares/      # 中间件
│   │   ├── app.ts            # 应用入口
│   │   └── database.ts       # 数据库初始化
│   └── package.json
│
└── .trae/documents/          # 项目文档
    ├── PRD-母婴零售店促销券系统.md
    └── 技术架构-母婴零售店促销券系统.md
```

## API接口

后端提供以下API接口：

- `POST /api/auth/login` - 用户登录
- `GET /api/coupons` - 查询券列表
- `POST /api/coupons` - 创建券
- `GET /api/coupons/:id` - 获取券详情
- `POST /api/coupons/:id/submit` - 提交复核
- `POST /api/coupons/:id/review` - 复核操作
- `GET /api/dashboard/*` - 首页数据接口

详情请参考技术架构文档。
