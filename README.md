# 企业内训管理系统

企业内训部的签到、考试与作业回收全栈管理系统。

## 功能特点

- 多角色权限管理（培训经理、部门负责人、讲师、学员）
- 签到管理：支持扫码签到、手动签到、状态标记
- 异常处理：签到异常、考试异常、作业异常的完整处理流程
- 作业回收：作业布置、提交、批改、历史版本回看
- 考试管理：考试发布、成绩录入、统计分析
- 数据导出：支持签到表、成绩表等Excel导出
- 消息通知：站内信通知系统
- 时间线追溯：所有操作记录可追溯

## 技术栈

- 前端：React 18 + TypeScript + Vite + Tailwind CSS
- 后端：Express.js + Prisma + SQLite
- 认证：JWT

## 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- npm 9.x 或更高版本

### 安装和初始化

```bash
# 安装根目录依赖
npm install

# 安装前后端依赖并初始化数据库
npm run setup
```

### 启动开发服务器

```bash
npm run dev
```

- 前端访问地址：http://localhost:5173
- 后端API地址：http://localhost:3000

### 测试账号

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 培训经理 | zhang@company.com | password123 |
| 部门负责人 | li.manager@company.com | password123 |
| 讲师 | wang@company.com | password123 |
| 学员 | zhao@company.com | password123 |

## 项目结构

```
├── frontend/          # 前端项目
│   ├── src/
│   │   ├── components/   # 组件
│   │   ├── pages/        # 页面
│   │   ├── services/      # API服务
│   │   └── store/        # 状态管理
│   └── ...
├── api/               # 后端项目
│   ├── prisma/
│   │   ├── schema.prisma # 数据模型
│   │   └── seed.ts       # 种子数据
│   ├── src/
│   │   └── server.ts      # 服务器入口
│   └── ...
└── package.json
```

## 主要功能演示

1. **签到处理**
   - 使用讲师账号登录
   - 访问签到管理页面
   - 选择课程进行签到
   - 支持已到、迟到、请假、缺席等状态

2. **异常处理**
   - 使用培训经理账号登录
   - 访问异常处理中心
   - 查看和处理各类异常
   - 填写处理方案

3. **作业回收**
   - 访问作业回收页面
   - 查看学员提交情况
   - 进行作业批改
   - 查看历史批改记录

4. **数据导出**
   - 访问课程详情或签到详情
   - 点击导出按钮
   - 下载Excel格式的签到表

## 开发说明

- 前端代码规范：遵循 React 18 + TypeScript 最佳实践
- 后端代码规范：遵循 Express.js + Prisma 最佳实践
- 所有API接口统一返回格式：`{ code, data, message }`
- 数据库使用 SQLite，便于本地演示

## License

MIT
