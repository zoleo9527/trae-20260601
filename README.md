# 电梯维保管理系统 - 维保计划与到场签到

## 业务背景

聚焦一线最常见的麻烦：维保计划和到场签到之间的责任说不清。
通过**维保技师 → 客服 → 项目主管**接力的方式，保证主链路可追溯。

## 核心特性

### 🔄 主链路（接力模式）
1. **客服**：创建维保计划、派单给技师
2. **维保技师**：接收工单 → 到场签到（GPS定位+拍照）→ 完成签退（填写工作内容）
3. **项目主管**：审核维保记录、批量处理

### 📋 功能清单
- ✅ 维保计划管理（列表、详情、历史备注时间线）
- ✅ 到场签到（GPS定位、现场拍照、位置备注）
- ✅ 完成签退（工作内容、问题描述、处理方案）
- ✅ 签到记录回看（时间、地点、照片、工作结果）
- ✅ 批量审核（主管可多选批量通过/驳回）
- ✅ 角色权限控制（3种角色不同菜单和操作权限）
- ✅ 完整的处理历史时间线（每一步操作都留痕）

## 演示账号

| 用户名 | 密码 | 角色 | 说明 |
|--------|------|------|------|
| `admin` | `123456` | 项目主管 | 审核、批量处理 |
| `kefu` | `123456` | 客服 | 创建计划、派单 |
| `jishi1` | `123456` | 维保技师 | 签到、签退 |
| `jishi2` | `123456` | 维保技师 | 签到、签退 |

## 快速启动

### 方式一：一键启动
```bash
# 首次运行需要安装依赖
cd elevator-maintenance-web && npm install && cd ..

# 启动（需要两个终端分别执行）
./start-backend.sh    # 终端1：启动后端
./start-frontend.sh   # 终端2：启动前端
```

### 方式二：分别启动

#### 启动后端
```bash
cd elevator-maintenance
export JAVA_HOME="/opt/homebrew/opt/openjdk@11"
mvn spring-boot:run
```
- 后端地址：http://localhost:8080/api
- H2控制台：http://localhost:8080/api/h2-console
  - JDBC URL: `jdbc:h2:mem:elevator`
  - 用户名: `sa`
  - 密码: (空)

#### 启动前端
```bash
cd elevator-maintenance-web
npm install
npm run dev
```
- 前端地址：http://localhost:5173

## 主链路操作演示

### 路径1：技师签到流程
1. 使用 `jishi1 / 123456` 登录（维保技师）
2. 点击「维保计划」→ 查看已派单的计划
3. 点击计划进入详情页
4. 点击「到场签到」按钮
5. 确认地理位置（支持GPS或模拟）、拍照（支持模拟）
6. 完成维保后点击「完成签退」
7. 填写工作内容、工作结果、问题描述等
8. 提交后状态变为「待审核」

### 路径2：主管审核流程
1. 使用 `admin / 123456` 登录（项目主管）
2. 点击「批量审核」菜单
3. 可勾选多条待审核记录
4. 点击「批量审核」→ 选择通过/驳回 → 填写审核意见
5. 或进入计划详情页逐条审核

### 路径3：客服派单流程
1. 使用 `kefu / 123456` 登录（客服）
2. 点击「维保计划」→「新增计划」
3. 选择电梯、技师、计划时间、填写维保内容
4. 或对「待派单」状态的计划点击「派单」

## 技术栈

### 后端
- Java 11 + Spring Boot 2.7.18
- Spring Data JPA + H2 内存数据库
- Lombok
- Jackson JSR310 (日期时间处理)

### 前端
- Vue 3 + <script setup>
- Vite 5
- Vue Router 4 + Pinia
- Element Plus 2
- Axios + Day.js

## 样例数据

系统启动时自动初始化：
- 5部电梯（阳光花园、星河大厦、翠湖苑公寓等）
- 8条维保计划（覆盖所有状态：待派单、已派单、维保中、待审核、已完成）
- 多条签到记录（含进行中的签到）
- 完整的历史备注时间线（可从详情页一路点到处理完成）

## API 接口

### 认证
- `POST /api/auth/login` - 登录

### 维保计划
- `GET /api/plans` - 获取计划列表（支持按技师、状态筛选）
- `GET /api/plans/{id}` - 获取计划详情
- `GET /api/plans/{id}/notes` - 获取计划的历史备注
- `POST /api/plans` - 创建计划
- `POST /api/plans/dispatch` - 派单
- `POST /api/plans/review` - 审核
- `POST /api/plans/batch-review` - 批量审核

### 签到
- `GET /api/checkin` - 获取签到记录列表
- `GET /api/checkin/{id}` - 获取签到详情
- `GET /api/checkin/plan/{planId}/active` - 获取计划的活跃签到
- `POST /api/checkin` - 到场签到
- `POST /api/checkin/checkout` - 完成签退

## 目录结构

```
.
├── elevator-maintenance/        # 后端Spring Boot项目
│   ├── src/main/java/com/elevator/maintenance/
│   │   ├── entity/              # 数据库实体
│   │   ├── repository/          # JPA Repository
│   │   ├── service/             # 业务逻辑层
│   │   ├── controller/          # REST API
│   │   ├── dto/                 # 数据传输对象
│   │   ├── common/              # 通用类
│   │   └── config/              # 配置类
│   └── pom.xml
├── elevator-maintenance-web/    # 前端Vue项目
│   ├── src/
│   │   ├── views/               # 页面组件
│   │   ├── layout/              # 布局组件
│   │   ├── router/              # 路由配置
│   │   ├── store/               # Pinia状态管理
│   │   ├── api/                 # API接口
│   │   └── utils/               # 工具类
│   └── package.json
├── start-backend.sh             # 后端启动脚本
├── start-frontend.sh            # 前端启动脚本
└── README.md
```
