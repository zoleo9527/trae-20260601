# 司法鉴定所 - 委托受理与材料核验系统

## 项目简介

这是一个完整的司法鉴定所委托受理与材料核验系统，采用 React + Express 技术栈，支持完整的业务流程管理和审计追踪。

## 核心功能

- **委托受理管理**：完整的委托单创建、编辑、状态流转
- **材料核验**：逐项材料核验，支持核验通过/不通过
- **质控审核**：质量控制审核流程
- **审计日志**：完整的操作审计追踪
- **异常单处理**：支持缺材料、超时、复核不通过等异常情况

## 技术栈

- **前端**: React 18 + React Router + Vite
- **后端**: Express.js + Node.js
- **数据库**: SQLite
- **认证**: JWT

## 快速启动

### 方法一：自动启动（推荐）

```bash
chmod +x start.sh
./start.sh
```

### 方法二：手动启动

**1. 初始化数据库**
```bash
cd backend
node seed.js
```

**2. 安装依赖并启动后端**
```bash
cd backend
npm install
npm start
```

**3. 安装依赖并启动前端**
```bash
cd frontend
npm install
npm start
```

## 访问地址

- 前端：http://localhost:3000
- 后端：http://localhost:5000
- API：http://localhost:5000/api/v1

## 演示账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 受理员 | acceptor01 | demo123 |
| 鉴定人 | appraiser01 | demo123 |
| 质控审核 | qc01 | demo123 |
| 管理员 | admin | admin123 |

## 演示数据

系统预置了 7 个演示委托单：

1. **DEL-2024-001** - 待受理（正常单）
2. **DEL-2024-002** - 材料不全（异常单）
3. **DEL-2024-003** - 暂停/超时（异常单）
4. **DEL-2024-004** - 复核不通过（异常单）
5. **DEL-2024-005** - 核验不通过（异常单）
6. **DEL-2024-006** - 待质控审核（正常单）
7. **DEL-2024-007** - 已完成（正常单）

## 功能演示建议

### 场景一：从异常单开始（用户指定）

1. 登录系统（使用任意账号）
2. 进入"委托单管理"
3. 筛选异常单（勾选"仅显示异常单"）
4. 选择一个异常单查看详情
5. 演示异常处理流程

### 场景二：正常委托流程

1. 以受理员身份登录
2. 创建新委托单
3. 提交材料核验
4. 以鉴定人身份登录进行核验
5. 以质控审核身份登录进行审核
6. 完成鉴定

## 状态流转

```
PENDING_ACCEPTANCE (待受理)
    ↓ 受理员提交
ACCEPTANCE_IN_PROGRESS (受理中)
    ↓ 受理员完成
MATERIAL_VERIFICATION (材料核验中)
    ↓ 鉴定人核验
VERIFICATION_PASSED / VERIFICATION_FAILED / MATERIAL_INCOMPLETE
    ↓ 质控审核
QC_REVIEW_PENDING (待质控审核)
    ↓ 质控审核
QC_APPROVED / QC_REJECTED
    ↓
COMPLETED (已完成)
```

## 项目结构

```
judicial-appraisal/
├── frontend/                  # React前端
│   ├── src/
│   │   ├── components/       # 组件
│   │   ├── pages/           # 页面
│   │   ├── services/        # API服务
│   │   ├── context/         # 状态管理
│   │   └── styles/          # 样式
│   └── package.json
├── backend/                  # Express后端
│   ├── models/              # 数据模型
│   ├── routes/              # 路由
│   ├── services/            # 业务逻辑
│   ├── server.js            # 服务器入口
│   └── seed.js              # 数据初始化
└── .trae/documents/         # 项目文档
    ├── PRD.md              # 产品需求文档
    └── Technical-Architecture.md  # 技术架构文档
```

## 开发说明

- 前端使用 Vite 进行构建和热更新
- 后端使用 Express.js 提供 REST API
- 数据库使用 SQLite，无需额外配置
- 所有操作都会记录审计日志

## 注意事项

1. 首次运行会自动初始化数据库和演示数据
2. 演示数据中的异常单可直接用于演示
3. 状态流转有严格的权限控制
4. 所有操作都有完整的审计追踪

## 许可证

MIT License
