# 洗浴中心储物柜异常与赔付处理系统

## 项目结构

```
trae-20260601-2/
├── config/                     # Django项目配置
│   ├── settings.py             # 项目配置
│   ├── urls.py                 # 路由配置
│   └── wsgi.py
├── locker_system/              # 核心业务应用
│   ├── api.py                  # API接口实现
│   ├── error_codes.py          # 统一错误码定义
│   ├── models.py               # 数据模型
│   ├── schemas.py              # Pydantic Schema
│   ├── admin.py                # 后台管理配置
│   └── management/
│       └── commands/
│           └── init_data.py    # 初始化数据脚本
├── manage.py                   # Django管理脚本
└── requirements.txt            # 依赖列表
```

## 核心业务模型

### 1. 人员与角色
- **StaffProfile**: 员工档案，包含4种角色：前台、楼层主管、财务、管理员

### 2. 基础资源
- **LockerArea**: 储物柜区域（男宾区、女宾区、VIP区等）
- **Locker**: 储物柜，状态：空闲/占用/损坏/维护中
- **Wristband**: 手牌，状态：空闲/已发放/遗失/损坏
- **Technician**: 技师，关联技师排班

### 3. 异常处理流程
- **LockerAbnormal**: 储物柜异常记录
  - 异常类型：无法开门、物品错放、物品遗失、柜体损坏、手牌遗失、客人投诉、其他
  - 状态流转：待处理 → 处理中 → （待赔付/已解决）/ 已退回
- **AbnormalProgress**: 异常处理进度日志，记录每一步操作

### 4. 赔付处理流程
- **Compensation**: 赔付记录
  - 状态流转：待审核 → 已审核 → 已支付 / 已拒绝
- **CompensationProgress**: 赔付处理进度日志

## 业务流程（前台-楼层主管-财务接力）

### 第一棒：前台
1. 登记异常：`POST /api/locker/abnormals`
   - 选择储物柜、异常类型、填写客人信息和描述
   - 设置优先级和期望处理时限
   - 可关联手牌和涉及技师

### 第二棒：楼层主管
2. 派单处理：`PUT /api/locker/abnormals/{id}/assign`
   - 指派给具体处理人

3. 处理异常：`PUT /api/locker/abnormals/{id}/process`
   - 填写处理结果
   - 选择是否需要赔付，如需要则填写赔付信息并自动生成赔付单

4. 退回异常：`PUT /api/locker/abnormals/{id}/return`
   - 如无法处理，填写退回原因退回前台

### 第三棒：财务
5. 审核赔付：`PUT /api/locker/compensations/{id}/review`
   - 审核通过或拒绝，可调整赔付金额
   - 拒绝自动将关联异常退回

6. 支付赔付：`PUT /api/locker/compensations/{id}/pay`
   - 记录支付方式、凭证号、客人签收
   - 支付完成自动关闭异常

## API接口列表

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/locker/dashboard` | 仪表盘统计 |
| GET | `/api/locker/abnormals` | 异常记录列表（分页筛选） |
| GET | `/api/locker/abnormals/{id}` | 异常详情（含处理进度） |
| POST | `/api/locker/abnormals` | 前台登记异常 |
| PUT | `/api/locker/abnormals/{id}/assign` | 派单 |
| PUT | `/api/locker/abnormals/{id}/process` | 处理异常 |
| PUT | `/api/locker/abnormals/{id}/return` | 退回异常 |
| GET | `/api/locker/compensations` | 赔付记录列表 |
| GET | `/api/locker/compensations/{id}` | 赔付详情（回看） |
| PUT | `/api/locker/compensations/{id}/review` | 财务审核赔付 |
| PUT | `/api/locker/compensations/{id}/pay` | 财务支付赔付 |
| GET | `/api/locker/lockers` | 储物柜列表 |
| GET | `/api/locker/wristbands` | 手牌列表 |
| GET | `/api/locker/technicians` | 技师列表 |
| GET | `/api/locker/staff` | 员工列表 |
| GET | `/api/locker/locker-areas` | 储物柜区域列表 |

## 关键特性

### 1. 统一错误码
- 定义在 `locker_system/error_codes.py`
- 储物柜、手牌、异常、赔付各有独立错误码段
- 所有接口返回统一格式：`{code, message, data}`

### 2. 分页与筛选
- 支持 page/page_size 分页
- 异常列表支持：状态、类型、区域、优先级、日期、关键词等筛选
- 支持单独筛选：今日待办、已拖延、已退回

### 3. 默认列表智能展示
**默认列表自动同时显示三类数据：**
- 今天要办的：今日时限内且未完成的
- 已经拖延的：已超期仍未处理的
- 刚刚被退回的：状态为已退回的

无需前端额外传参，打开列表即看到最紧急的事。

### 4. 处理进度可追溯
- 异常和赔付都有完整的进度日志
- 谁在什么时候做了什么操作一目了然
- 赔付详情页支持完整回看

## 快速启动

```bash
# 安装依赖
pip install -r requirements.txt

# 数据迁移
python manage.py makemigrations
python manage.py migrate

# 初始化测试数据
python manage.py init_data

# 启动服务
python manage.py runserver 0.0.0.0:8000
```

访问地址：
- API文档：http://localhost:8000/api/docs
- 管理后台：http://localhost:8000/admin

### 测试账号
| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | admin123456 |
| 前台 | reception | 123456 |
| 楼层主管 | supervisor | 123456 |
| 财务 | finance | 123456 |
