# 眼科手术中心 - 术前检查与手术排期系统

## 系统功能说明

本系统实现了眼科手术中心的术前检查与手术排期的全流程管理，通过工作流驱动的连续处理工作面。

## 核心问题解决：
1. **谁在处理** - 明确当前处理人及角色（接待人员、专业人员、审核主管
2. **卡在哪里** - 每个节点的阻塞原因
3. **为什么没完成** - 完整的操作日志追溯

## 技术栈

- **后端**: Spring Boot 3.2.0 + JPA + H2 Database
- **前端**: React 18 + TypeScript + Ant Design + Vite
- **工作流状态机驱动

## 项目结构

```
├── backend/                    # Spring Boot 后端
│   ├── src/main/java/com/eyeclinic/surgerycenter/
│   │   ├── enums/           # 枚举定义
│   │   ├── entity/          # 数据实体
│   │   ├── repository/      # 数据访问层
│   │   ├── service/       # 业务逻辑
│   │   ├── controller/     # REST API
│   │   ├── dto/            # 数据传输对象
│   │   ├── exception/    # 异常处理
│   │   ├── common/     # 通用类
│   │   ├── config/     # 配置类
│   │   └── SurgeryCenterApplication.java
│   └── pom.xml
│   └── src/main/resources/
├── src/                   # React 前端
│   ├── pages/           # 页面组件
│   ├── services/        # API 服务
│   ├── types/         # TypeScript 类型
│   └── main.tsx
│   └── App.tsx
├── package.json
├── vite.config.ts
└── README.md
```

## 快速开始

### 后端启动

```bash
cd backend
mvn spring-boot:run
```

后端服务端口：http://localhost:8080

H2 控制台：http://localhost:8080/h2-console

### 前端启动

```bash
npm install
npm run dev
```

前端服务端口：http://localhost:3000

## 核心功能

### 1. 工作流状态机

| 状态 | 说明 | 责任角色 |
|------|------|----------|
| PENDING_REGISTRATION | 待登记 | 接待人员 |
| PREOP_IN_PROGRESS | 术前检查进行中 | 专业人员 |
| PREOP_REVIEW | 术前检查待审核 | 审核主管 |
| PREOP_APPROVED | 术前检查通过 | 系统 |
| PREOP_REJECTED | 术前检查驳回 | 审核主管 |
| SCHEDULING | 手术排期中 | 接待人员 |
| SCHEDULE_REVIEW | 排期待审核 | 审核主管 |
| SCHEDULE_CONFIRMED | 已排期确认 | 审核主管 |
| SCHEDULE_REJECTED | 排期驳回 | 审核主管 |
| COMPLETED | 流程完成 | 系统 |

### 2. 术前检查项

系统自动初始化8项检查：

1. 视力检查
2. 眼压检查
3. 角膜厚度
4. 眼轴长度
5. 眼底检查
6. 角膜地形图
7. 血液检查
8. 病史评估

### 3. 手术类型

| 手术类型 | 预计时长
| CATARACT | 白内障手术 | 30分钟 |
| LASIK | 准分子激光手术 | 45分钟 |
| ICL | ICL晶体植入 | 60分钟 |
| GLAUCOMA | 青光眼手术 | 45分钟 |
| RETINA | 视网膜手术 | 90分钟 |
| PTERYGIUM | 翼状胬肉手术 | 25分钟 |

### 4. 角色权限控制

| 角色 | 权限 |
|------|------|
| 接待人员 (RECEPTIONIST) | 登记、启动检查、安排排期 |
| 专业人员 (SPECIALIST) | 录入检查结果、提交审核 |
| 审核主管 (SUPERVISOR) | 审核检查结果、审核排期 |

## 错误码定义

| 错误码 | 说明 |
|--------|------|
| 0000 | 操作成功 |
| 1000 | 系统内部错误 |
| 1001 | 参数错误 |
| 1002 | 数据不存在 |
| 2001 | 非法的状态流转 |
| 2002 | 权限不足，无法执行此操作 |
| 2003 | 术前检查项未全部完成 |
| 3001 | 患者不存在 |
| 3002 | 工作流实例不存在 |
| 3003 | 已有处理中的流程 |
| 4001 | 手术时间冲突 |
| 4002 | 手术日期无效 |
| 4003 | 耗材库存不足 |
| 5001 | 需要审核主管审批 |
| 5002 | 已完成流程不可操作 |

## REST API 接口

### 工作流相关

| Method | Path | 说明 |
|--------|------|------|
| POST | /api/workflow | 创建工作流 |
| GET | /api/workflow | 获取工作流列表 |
| GET | /api/workflow/{id} | 获取工作流详情 |
| POST | /api/workflow/{id}/start-check | 启动术前检查 |
| POST | /api/workflow/check-item | 更新检查项 |
| POST | /api/workflow/{id}/submit-check | 提交检查审核 |
| POST | /api/workflow/{id}/review-check | 审核检查结果 |
| POST | /api/workflow/{id}/start-scheduling | 开始手术排期 |
| POST | /api/workflow/{id}/submit-schedule | 提交排期审核 |
| POST | /api/workflow/{id}/review-schedule | 审核排期 |
| POST | /api/workflow/{id}/complete | 完成流程 |

### 通用接口

| Method | Path | 说明 |
|--------|------|------|
| GET | /api/users | 获取用户列表 |
| GET | /api/schedules | 获取手术排班 |
| GET | /api/export/workflows | 导出工作流（模拟） |
| GET | /api/export/schedules | 导出排班表（模拟） |

## 模拟接口说明

### 导出功能（已模拟实现）

系统目前导出接口已在后端实现框架，实际项目中可集成：

- **Excel 导出：使用 Apache POI 或 EasyExcel
- **PDF 导出：使用 iText 或 Apache PDFBox
- **附件上传**：使用 MinIO 或阿里云 OSS

### 附件能力（已模拟）

检查项支持 `attachmentUrl` 字段预留，实际项目中可扩展：

- 文件上传接口
- 文件预览
- 文件类型校验

## 种子数据

系统启动时自动初始化：

### 用户数据（7人）

- **接待人员**：张小迎、李接待
- **专业人员**：王医生、刘医师、陈主刀
- **审核主管**：赵主任、孙主管

### 患者数据（8人）

张三、李四、王五、赵六、钱七、孙八、周九、吴十

## 验收要点验证流程

1. 启动后端服务
2. 访问前端 http://localhost:3000
3. 在工作面板点击"新建流程"
4. 选择患者和手术类型
5. 启动术前检查
6. 逐项完成8项检查
7. 提交审核
8. 审核通过
9. 安排手术排期
10. 审核排期
11. 查看手术排班表

## 核心页面

1. **工作面板** (/ )
- 统计看板：待处理、检查中、排期中、已驳回
- 流程列表：展示所有进行中的流程
- 支持按处理人筛选

2. **流程详情** (/workflow/{id})
- 步骤进度条
- 基本信息 Tab
- 术前检查 Tab
- 手术排期 Tab
- 操作日志时间轴

3. **手术排班表** (/schedule)
- 周视图表格
- 按日期分组展示
- 导出功能

## 数据库表结构

### sys_user（用户表）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | Long | 主键 |
| username | String | 用户名 |
| real_name | String | 真实姓名 |
| role | String | 角色 |
| phone | String | 电话 |
| department | String | 部门 |
| active | Boolean | 是否启用 |

### patient（患者表）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | Long | 主键 |
| patient_no | String | 患者编号 |
| name | String | 姓名 |
| gender | String | 性别 |
| birth_date | Date | 出生日期 |
| id_card | String | 身份证 |
| phone | String | 电话 |
| medical_history | String | 病史 |
| allergy_history | String | 过敏史 |

### workflow_instance（工作流实例表）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | Long | 主键 |
| workflow_no | String | 流程编号 |
| patient_id | Long | 患者ID |
| surgery_type | String | 手术类型 |
| status | String | 当前状态 |
| current_handler_id | Long | 当前处理人 |
| block_reason | String | 阻塞原因 |
| remarks | String | 备注 |
| status_updated_at | DateTime | 状态更新时间 |

### preoperative_check（术前检查表）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | Long | 主键 |
| workflow_id | Long | 工作流ID |
| check_type | String | 检查类型 |
| status | String | 检查状态 |
| check_result | String | 检查结果 |
| measurement_value | String | 测量值 |
| reference_range | String | 参考范围 |
| checked_by_id | Long | 检查人 |
| checked_at | DateTime | 检查时间 |
| attachment_url | String | 附件URL |

### surgery_schedule（手术排班表）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | Long | 主键 |
| workflow_id | Long | 工作流ID |
| surgery_date | Date | 手术日期 |
| start_time | Time | 开始时间 |
| end_time | Time | 结束时间 |
| surgery_type | String | 手术类型 |
| operating_room | String | 手术室 |
| surgeon_id | Long | 主刀医生 |
| anesthesiologist_id | Long | 麻醉师 |
| material_list | String | 耗材清单 |
| confirmed | Boolean | 是否已确认 |
| rejection_reason | String | 驳回原因 |

### operation_log（操作日志表）
| 字段 | 类型 | 说明 |
|--------|------|------|
| id | Long | 主键 |
| workflow_id | Long | 工作流ID |
| workflow_no | String | 流程编号 |
| previous_status | String | 之前状态 |
| new_status | String | 新状态 |
| operation_type | String | 操作类型 |
| operation_desc | String | 操作描述 |
| operator_id | Long | 操作人 |
| operator_name | String | 操作人姓名 |
| remarks | String | 备注 |

## 注意事项

1. H2 为内存数据库，重启后数据丢失
2. 实际生产环境建议使用 MySQL 或 PostgreSQL
3. 生产环境需要添加用户认证和权限控制
4. 文件上传和导出功能需要根据实际需求扩展
5. 通知消息提醒功能可集成
