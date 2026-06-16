# 窗帘门店-客户量尺与报价确认系统

基于 Vue 3 + FastAPI 构建的窗帘门店业务管理系统，实现导购、量尺师、安装师傅的业务接力流程。

## 功能特性

### 业务流程
- **客户量尺**：导购创建量尺单，记录客户信息、窗户尺寸、窗帘需求
- **报价确认**：量尺师基于量尺单创建报价，安装师傅确认或驳回
- **材料补充**：量尺师可补充材料需求并计算额外费用
- **催单提醒**：支持客户催单功能，显示催单次数和时间

### 状态流转
```
导购创建量尺 → 待报价 → 量尺师创建报价 → 待确认 → 安装师傅确认/驳回
                                                    ↓         ↓
                                              已确认 → 已完成   已驳回 → 量尺师修改 → 重新提交 → 待确认
                                                    ↓
                                              待补材料 → 完成补料 → 待确认
```

### 角色权限
| 角色 | 权限 |
|------|------|
| 导购 | 创建/编辑量尺、催单、重新提交已驳回量尺 |
| 量尺师 | 驳回量尺、创建/修改报价、补充材料、完成补料、重新提交报价 |
| 安装师傅 | 确认报价、驳回报价、完成安装 |
| 管理员 | 所有权限 |

## 技术栈

- **前端**：Vue 3 + Element Plus + Vite
- **后端**：FastAPI + Python 3.8+
- **数据存储**：内存存储（模拟）

## 快速开始

### 环境要求
- Python 3.8+
- Node.js 18+

### 启动后端服务
```bash
cd backend
pip install -r requirements.txt
cd src
python main.py
```
后端服务运行在 http://localhost:8000

### 启动前端服务
```bash
cd frontend
npm install
npm run dev
```
前端服务运行在 http://localhost:5173（或其他可用端口）

### 登录信息
所有用户密码均为 `123456`，可选角色：
- 导购
- 量尺师
- 安装师傅
- 管理员

## API 接口

### 量尺管理
- `GET /api/measures` - 获取量尺列表
- `GET /api/measures/{id}` - 获取量尺详情
- `POST /api/measures` - 创建量尺
- `PUT /api/measures/{id}` - 更新量尺
- `POST /api/measures/{id}/reject` - 驳回量尺
- `POST /api/measures/{id}/resubmit` - 重新提交量尺
- `POST /api/measures/{id}/urgent` - 催单

### 报价管理
- `GET /api/quotes` - 获取报价列表
- `GET /api/quotes/{id}` - 获取报价详情
- `POST /api/quotes` - 创建报价
- `PUT /api/quotes/{id}` - 更新报价
- `POST /api/quotes/{id}/confirm` - 确认报价
- `POST /api/quotes/{id}/reject` - 驳回报价
- `POST /api/quotes/{id}/supplement` - 补充材料
- `POST /api/quotes/{id}/complete_supplement` - 完成补料
- `POST /api/quotes/{id}/resubmit` - 重新提交报价
- `POST /api/quotes/{id}/complete` - 完成安装

### 系统管理
- `POST /api/login` - 用户登录
- `GET /api/logs` - 获取操作日志
- `POST /api/reset` - 数据重置

## 数据重置

系统提供数据重置功能，可一键恢复到初始模拟数据：

1. 登录系统后点击左侧菜单「数据重置」
2. 在弹出的确认对话框中点击「确认重置」
3. 系统将恢复所有量尺单、报价单和操作日志到初始状态

> **注意**：数据重置会清除所有用户操作记录，请谨慎使用。

## 模拟能力边界

当前系统为演示版本，以下能力为模拟实现：

| 能力 | 状态 | 说明 |
|------|------|------|
| 用户认证 | 模拟 | 用户名密码硬编码，无真实认证机制 |
| 数据存储 | 模拟 | 使用内存存储，重启服务后恢复初始数据 |
| 文件上传 | 未实现 | 暂不支持图片、附件上传 |
| 消息通知 | 未实现 | 暂不支持消息推送、邮件通知 |
| 数据持久化 | 未实现 | 无数据库存储 |
| 权限控制 | 模拟 | 基于角色的权限控制为简单实现 |

## 项目结构

```
.
├── backend/
│   ├── src/
│   │   └── main.py          # FastAPI后端服务
│   └── requirements.txt     # Python依赖
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── LoginPage.vue      # 登录页
│   │   │   ├── MainLayout.vue     # 主布局
│   │   │   ├── MeasureList.vue    # 业务接力列表
│   │   │   ├── MeasureDetail.vue  # 量尺详情（含报价操作）
│   │   │   ├── MeasureModal.vue   # 新增/编辑量尺弹窗
│   │   │   ├── RejectModal.vue    # 驳回弹窗
│   │   │   ├── ResetModal.vue     # 数据重置弹窗
│   │   │   └── LogList.vue        # 操作日志
│   │   ├── App.vue                # 根组件
│   │   └── main.js                # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 开发说明

### 前端开发
```bash
cd frontend
npm install
npm run dev    # 开发模式
npm run build  # 生产构建
```

### 后端开发
```bash
cd backend
pip install -r requirements.txt
cd src
python main.py  # 启动开发服务器
```

## License

MIT License
