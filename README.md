# 鲜花配送站 - 配送派单与签收回传系统

## 环境要求

- Node.js >= 18
- macOS / Windows / Linux
- 网络环境（仅首次安装时下载 Electron 二进制）

## 启动步骤

```bash
# 1. 安装依赖（如下载慢请设置镜像）
# macOS/Linux:
export ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
npm install

# 2. 为 Electron 重编译 better-sqlite3 原生模块
npx electron-rebuild

# 3. 启动
npm start
```

应用启动后自动在 `data/flower_delivery.db` 创建 SQLite 数据库并填充 6 条处理人种子数据。

## 快捷键

| 快捷键 | 功能 |
|--------|------|
| Ctrl+N | 新增订单 |
| Esc | 关闭弹窗/侧滑面板 |

## 系统架构

```
main.js          Electron 主进程（窗口 + IPC 注册）
preload.js       安全 IPC 桥接（contextBridge）
src/database.js  SQLite 数据层（better-sqlite3，WAL 模式）
src/renderer/
  index.html     主界面
  app.js         渲染层交互逻辑
  styles.css     样式
```

### 数据模型（6 表）

| 表 | 说明 |
|----|------|
| handlers | 处理人（花艺师 / 配送调度 / 售后客服） |
| orders | 订单，9 种状态流转 |
| dispatches | 派单记录，含卡点原因 stuck_reason |
| signatures | 签收回传，含退回原因 return_reason 和补材料说明 supplement_desc |
| exceptions | 异常记录（催/退回/补材料），三态处理（未处理→处理中→已解决） |
| handover_logs | 交接日志，记录责任流转 |

### 订单状态流转

```
待制作 → 制作中 → 待派单 → 已派单 → 配送中 → 已送达待签收 → 已签收
                                                        ↓
                                                       退回
```

### 核心业务规则

1. **谁在处理** — 订单详情侧滑「谁在处理」区域汇总花艺师、配送调度、售后客服
2. **派单卡在哪里** — 派单状态为「待派单」或「异常」时，必须填写卡点原因
3. **签收回传为什么还没完成** — 退回必须填退回原因，补材料必须填说明；系统自动创建对应异常记录并分配售后客服
4. **签收前置校验** — 派单必须到达「已送达待签收」才能录入签收
5. **退回/补材料自动联动** — 签收退回或补材料时，系统自动：①创建异常记录 ②分配售后客服为处理人 ③写入交接日志
6. **异常回填** — 处理既有异常时弹窗回填原类型、处理人、描述，避免覆盖

## 系统边界（当前未接真实外部系统）

| 边界项 | 说明 |
|--------|------|
| 本地单机运行 | 数据存储在本地 SQLite 文件 `data/flower_delivery.db`，不支持多终端同步或远程访问 |
| 无外部订单系统对接 | 订单为本地手动录入，未接电商平台、微信小程序等 |
| 无短信/通知推送 | 催办仅在系统内展示，不向客户或配送员发送短信/推送 |
| 无地图/定位集成 | 配送员无实时位置追踪，配送状态靠手动更新 |
| 无电子签名采集 | 签收时无法采集手写签名图片，signature_data 字段预留但未使用 |
| 无支付系统对接 | 不处理付款/退款，仅跟踪配送和签收流程 |
| 无图片上传 | 花束成品照、配送现场照暂不支持 |
| 旧台账/沟通截图 | 来源可选「旧台账」，但无法直接导入旧台账 Excel 或解析微信截图，需手动录入 |
| 数据无自动备份 | SQLite 文件需自行定期备份，系统不提供自动备份功能 |

## 数据备份

数据库文件位于 `data/flower_delivery.db`，可直接复制备份：

```bash
cp data/flower_delivery.db data/flower_delivery_backup_$(date +%Y%m%d).db
```
