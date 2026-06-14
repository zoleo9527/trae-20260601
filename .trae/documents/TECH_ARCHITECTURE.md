# 企业内训部-证书发放与效果评估系统 技术架构文档

## 1. 技术选型

### 1.1 后端技术栈
- **运行时**：Node.js (v18+)
- **框架**：Express.js 4.x
- **数据库**：SQLite 3（轻量级，适合本地运行）
- **ORM**：better-sqlite3（同步API，性能优秀）
- **数据验证**：Joi
- **跨域处理**：cors

### 1.2 前端技术栈
- **框架**：React 18
- **状态管理**：React Context + useReducer
- **路由**：React Router v6
- **HTTP客户端**：axios
- **UI组件**：自定义组件 + Tailwind CSS
- **图标**：Heroicons
- **日期处理**：dayjs

### 1.3 开发工具
- **构建工具**：Vite
- **包管理**：npm

---

## 2. 项目结构

```
/trae-20260601-3
├── server/                    # 后端项目
│   ├── routes/                # 路由模块
│   │   ├── training.js        # 培训相关API
│   │   ├── certificate.js     # 证书相关API
│   │   ├── evaluation.js      # 效果评估API
│   │   ├── exception.js      # 异常处理API
│   │   └── auth.js            # 角色切换API
│   ├── db/                    # 数据库相关
│   │   ├── database.js        # 数据库初始化
│   │   ├── schema.sql         # 数据表结构
│   │   └── seed.js            # 样例数据
│   ├── middleware/            # 中间件
│   │   └── errorHandler.js    # 错误处理
│   └── server.js              # 服务器入口
├── frontend/                  # 前端项目
│   ├── src/
│   │   ├── components/        # 公共组件
│   │   │   ├── Layout/        # 布局组件
│   │   │   ├── FilterBar/     # 筛选栏
│   │   │   ├── DataTable/     # 数据表格
│   │   │   ├── StatusBadge/   # 状态标签
│   │   │   └── Modal/         # 弹窗
│   │   ├── pages/             # 页面组件
│   │   │   ├── Dashboard/     # 工作台
│   │   │   ├── Training/      # 培训管理
│   │   │   ├── Certificate/   # 证书管理
│   │   │   ├── Evaluation/    # 效果评估
│   │   │   └── Exception/     # 异常处理
│   │   ├── context/           # 上下文
│   │   │   └── AuthContext.jsx  # 角色上下文
│   │   ├── hooks/             # 自定义Hooks
│   │   ├── services/          # API服务
│   │   ├── utils/             # 工具函数
│   │   ├── App.jsx            # 应用入口
│   │   └── main.jsx           # React入口
│   └── package.json
├── package.json               # 根目录package.json
└── server.js                  # 启动脚本
```

---

## 3. 数据库设计

### 3.1 数据表结构

#### users（用户表）
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR(50) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  role ENUM('training_manager', 'department_head', 'instructor') NOT NULL,
  department VARCHAR(100),
  email VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### training_projects（培训项目表）
```sql
CREATE TABLE training_projects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name VARCHAR(200) NOT NULL,
  type ENUM('required', 'elective') NOT NULL,
  format ENUM('online', 'offline', 'hybrid') NOT NULL,
  instructor_id INTEGER REFERENCES users(id),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM('planning', 'registration', 'in_progress', 'completed', 'cancelled') NOT NULL,
  max_participants INTEGER DEFAULT 50,
  description TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### training_registrations（培训报名表）
```sql
CREATE TABLE training_registrations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES training_projects(id),
  user_id INTEGER REFERENCES users(id),
  status ENUM('registered', 'attended', 'absent', 'cancelled', 'replaced') NOT NULL,
  absence_reason TEXT,
  check_in_time DATETIME,
  check_out_time DATETIME,
  remarks TEXT,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### certificates（证书表）
```sql
CREATE TABLE certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  project_id INTEGER REFERENCES training_projects(id),
  user_id INTEGER REFERENCES users(id),
  status ENUM('pending', 'creating', 'pending_review', 'needs_correction', 'approved', 'issued', 'cancelled', 'revoked') NOT NULL,
  issue_date DATE,
  correction_reason TEXT,
  revoke_reason TEXT,
  created_by INTEGER REFERENCES users(id),
  issued_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### certificate_history（证书历史记录表）
```sql
CREATE TABLE certificate_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  certificate_id INTEGER REFERENCES certificates(id),
  action VARCHAR(50) NOT NULL,
  from_status VARCHAR(50),
  to_status VARCHAR(50),
  operator_id INTEGER REFERENCES users(id),
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### homework_submissions（作业提交表）
```sql
CREATE TABLE homework_submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES training_projects(id),
  user_id INTEGER REFERENCES users(id),
  status ENUM('not_submitted', 'submitted', 'late', 'graded') NOT NULL,
  submission_date DATETIME,
  grade DECIMAL(5,2),
  remarks TEXT
);
```

#### effect_evaluations（效果评估表）
```sql
CREATE TABLE effect_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  project_id INTEGER REFERENCES training_projects(id),
  satisfaction_score DECIMAL(3,2),
  completion_rate DECIMAL(5,2),
  pass_rate DECIMAL(5,2),
  behavior_change_score DECIMAL(3,2),
  performance_improvement DECIMAL(5,2),
  report_status ENUM('draft', 'published', 'frozen') NOT NULL,
  frozen_reason TEXT,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### exceptions（异常记录表）
```sql
CREATE TABLE exceptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type ENUM('registration_absent', 'homework_not_submitted', 'certificate_error', 'certificate_duplicate', 'certificate_missed') NOT NULL,
  project_id INTEGER REFERENCES training_projects(id),
  related_id INTEGER,
  related_type VARCHAR(50),
  description TEXT,
  status ENUM('discovered', 'assigned', 'processing', 'resolved', 'closed') NOT NULL,
  priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
  discovered_by INTEGER REFERENCES users(id),
  assigned_to INTEGER REFERENCES users(id),
  resolution TEXT,
  resolved_by INTEGER REFERENCES users(id),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME
);
```

#### exception_history（异常处理历史表）
```sql
CREATE TABLE exception_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  exception_id INTEGER REFERENCES exceptions(id),
  action VARCHAR(50) NOT NULL,
  operator_id INTEGER REFERENCES users(id),
  remark TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. API接口设计

### 4.1 认证与角色切换
```
GET    /api/auth/current-user        # 获取当前用户信息
POST   /api/auth/switch-role         # 切换角色
GET    /api/auth/permissions          # 获取当前角色权限
```

### 4.2 培训管理
```
GET    /api/training/projects         # 获取培训项目列表（支持筛选）
GET    /api/training/projects/:id     # 获取培训项目详情
POST   /api/training/projects         # 创建培训项目
PUT    /api/training/projects/:id    # 更新培训项目
GET    /api/training/registrations    # 获取报名列表
PUT    /api/training/registrations/:id  # 更新报名状态
```

### 4.3 证书管理
```
GET    /api/certificates              # 获取证书列表（支持筛选）
GET    /api/certificates/:id         # 获取证书详情
POST   /api/certificates             # 创建证书
PUT    /api/certificates/:id         # 更新证书状态
GET    /api/certificates/:id/history # 获取证书历史记录
POST   /api/certificates/batch       # 批量操作证书
```

### 4.4 效果评估
```
GET    /api/evaluations              # 获取效果评估列表
GET    /api/evaluations/:id         # 获取评估详情
PUT    /api/evaluations/:id         # 更新评估
GET    /api/evaluations/statistics  # 获取统计数据
POST   /api/evaluations/recalculate # 手动触发重新计算
```

### 4.5 异常处理
```
GET    /api/exceptions              # 获取异常列表（支持筛选）
GET    /api/exceptions/:id         # 获取异常详情
POST   /api/exceptions             # 创建异常记录
PUT    /api/exceptions/:id         # 更新异常状态
GET    /api/exceptions/:id/history # 获取处理历史
```

---

## 5. 核心业务逻辑

### 5.1 证书状态变更触发效果评估
```javascript
// 证书状态变更时，自动触发效果评估重新计算
async function onCertificateStatusChange(certificateId, newStatus, operatorId) {
  const certificate = await getCertificate(certificateId);
  const projectId = certificate.project_id;

  // 记录历史
  await addCertificateHistory({
    certificate_id: certificateId,
    action: 'status_changed',
    from_status: certificate.status,
    to_status: newStatus,
    operator_id: operatorId
  });

  // 更新证书状态
  await updateCertificateStatus(certificateId, newStatus);

  // 触发效果评估重新计算
  if (['issued', 'cancelled', 'revoked'].includes(newStatus)) {
    await recalculateEffectEvaluation(projectId, {
      reason: `证书状态变更为${newStatus}`,
      triggered_by: 'certificate_status_change'
    });
  }
}
```

### 5.2 效果评估重新计算逻辑
```javascript
async function recalculateEffectEvaluation(projectId, trigger) {
  const project = await getProject(projectId);

  // 获取相关数据
  const totalRegistered = await countRegistrations(projectId, 'registered');
  const totalAttended = await countRegistrations(projectId, 'attended');
  const totalCertificatesIssued = await countCertificates(projectId, 'issued');
  const totalCertificatesCancelled = await countCertificates(projectId, 'cancelled');
  const totalHomeworkSubmitted = await countHomeworkSubmitted(projectId);

  // 计算指标
  const completionRate = (totalAttended / totalRegistered) * 100;
  const issuanceRate = (totalCertificatesIssued / totalAttended) * 100;
  const passRate = ((totalCertificatesIssued - totalCertificatesCancelled) / totalAttended) * 100;

  // 更新评估记录
  await updateEvaluation(projectId, {
    completion_rate: completionRate,
    issuance_rate: issuanceRate,
    pass_rate: passRate,
    report_status: 'published',
    published_at: new Date(),
    updated_at: new Date()
  });

  // 记录触发原因
  await logEvaluationTrigger(projectId, trigger);
}
```

### 5.3 异常处理联动
```javascript
// 异常处理完成时，检查是否需要冻结效果评估
async function onExceptionResolved(exceptionId, resolution) {
  const exception = await getException(exceptionId);

  // 如果是证书相关异常，可能需要冻结评估
  if (exception.type.startsWith('certificate_')) {
    const projectId = exception.project_id;

    // 检查是否有未解决的证书异常
    const unresolvedCount = await countUnresolvedCertificateExceptions(projectId);

    if (unresolvedCount > 0) {
      // 冻结效果评估
      await freezeEvaluation(projectId, {
        reason: `存在${unresolvedCount}个未解决的证书异常`,
        exception_id: exceptionId
      });
    }
  }
}
```

---

## 6. 前端架构

### 6.1 路由设计
```javascript
const routes = [
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '', element: <Dashboard /> },
      { path: 'training', children: [
        { path: '', element: <TrainingList /> },
        { path: ':id', element: <TrainingDetail /> }
      ]},
      { path: 'certificates', children: [
        { path: '', element: <CertificateList /> },
        { path: ':id', element: <CertificateDetail /> }
      ]},
      { path: 'evaluations', children: [
        { path: '', element: <EvaluationList /> },
        { path: ':id', element: <EvaluationDetail /> }
      ]},
      { path: 'exceptions', children: [
        { path: '', element: <ExceptionList /> },
        { path: ':id', element: <ExceptionDetail /> }
      ]}
    ]
  }
];
```

### 6.2 角色权限控制
```javascript
const rolePermissions = {
  training_manager: {
    dashboard: ['pending_approvals', 'statistics', 'recent_activities'],
    certificates: ['view', 'create', 'approve', 'reject', 'revoke'],
    evaluations: ['view', 'export', 'recalculate'],
    exceptions: ['view', 'assign', 'resolve']
  },
  department_head: {
    dashboard: ['department_training', 'team_attendance'],
    training: ['view', 'register'],
    certificates: ['view'],
    exceptions: ['view', 'report']
  },
  instructor: {
    dashboard: ['course_schedule', 'pending_homework'],
    training: ['view', 'check_in', 'record_performance'],
    certificates: ['view', 'create', 'submit_review'],
    homework: ['view', 'grade']
  }
};
```

### 6.3 Context设计
```javascript
// AuthContext - 管理当前用户和角色
const AuthContext = createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('training_manager');

  const switchRole = async (newRole) => {
    const permissions = await fetchPermissions(newRole);
    setCurrentRole(newRole);
    // 更新UI权限
  };

  return (
    <AuthContext.Provider value={{ user, currentRole, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}
```

---

## 7. 数据联动机制实现

### 7.1 证书变更 → 效果评估感知
```javascript
// 后端：监听证书变更事件
app.post('/api/certificates/:id/status', async (req, res) => {
  const { status, remark } = req.body;
  const certificateId = req.params.id;

  try {
    // 更新证书状态
    await certificateService.updateStatus(certificateId, status, remark);

    // 检查是否需要触发效果评估重新计算
    if (['issued', 'cancelled', 'revoked'].includes(status)) {
      const certificate = await certificateService.getById(certificateId);

      // 异步重新计算（不阻塞响应）
      evaluationService.triggerRecalculation(
        certificate.project_id,
        {
          type: 'certificate_status_change',
          certificate_id: certificateId,
          new_status: status
        }
      );
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### 7.2 WebSocket实时通知（可选）
```javascript
// 如果需要实时感知，可以使用WebSocket
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  socket.join(`user_${currentUserId}`);
  socket.join(`role_${currentRole}`);
});

function notifyEvaluationUpdate(projectId, message) {
  io.to(`project_${projectId}`).emit('evaluation_updated', message);
}
```

---

## 8. 启动脚本

### 8.1 开发环境
```bash
# 安装依赖
npm install

# 初始化数据库
npm run db:init

# 启动开发服务器
npm run dev
```

### 8.2 生产环境
```bash
# 构建前端
npm run build

# 启动服务器
npm start
```

---

## 9. 环境变量

```
PORT=3000
DB_PATH=./data/training.db
NODE_ENV=development
```

---

## 10. 测试数据

系统将初始化以下样例数据：

### 用户
1. 王芳 - 培训经理
2. 赵丽 - 部门负责人（技术部）
3. 李明 - 讲师

### 培训项目
1. 新员工入职培训（已完成，证书已发放）
2. 中层管理能力提升（证书发放中）
3. 技术技能认证培训（异常处理中）

### 异常记录
- 报名后缺席
- 课后作业未提交
- 证书信息错误
- 证书疑似重复发放

所有数据包含完整的操作历史记录，支持从详情页一路点到处理完成。
