# 税务咨询受理与资料清单管理系统

基于 Tauri + React + TypeScript + Vite + Tailwind CSS 构建的桌面端税务咨询管理系统。

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式方案**: Tailwind CSS
- **状态管理**: Zustand
- **路由方案**: React Router
- **图标库**: Lucide React
- **桌面端**: Tauri

## 环境要求

- Node.js >= 18
- Rust >= 1.60 (Tauri 构建需要)
- 系统依赖 (macOS: Xcode Command Line Tools)

## 安装依赖

```bash
npm install
```

## 开发命令

### 启动 Web 开发服务器
```bash
npm run dev
```

### 启动 Tauri 桌面应用开发模式
```bash
npm run tauri:dev
```

### 构建 Web 生产版本
```bash
npm run build
```

### 预览 Web 生产构建
```bash
npm run preview
```

### 构建 Tauri 桌面应用安装包
```bash
npm run tauri:build
```

## 目录结构

```
.
├── src/                  # 前端源代码
├── src-tauri/            # Tauri Rust 后端代码
├── index.html            # HTML 入口
├── package.json          # 项目依赖与脚本
├── vite.config.ts        # Vite 配置
├── tailwind.config.js    # Tailwind CSS 配置
├── postcss.config.js     # PostCSS 配置
├── tsconfig.json         # TypeScript 配置
├── tsconfig.node.json    # Vite 配置专用 TS 配置
└── eslint.config.js      # ESLint 配置
```

## 路径别名

项目已配置 `@` 路径别名指向 `src/` 目录，使用方式：

```ts
import App from '@/App'
import { useStore } from '@/store'
```

## 自定义主题

Tailwind CSS 已配置以下自定义颜色和字体：

### 颜色
- `primary`: #1e3a5f (深蓝)
- `accent`: #f59e0b (琥珀色)
- `success`: #10b981 (翡翠绿)
- `danger`: #ef4444 (红色)

### 字体
- `font-serif`: Noto Serif SC (思源宋体)
- `font-mono`: JetBrains Mono
