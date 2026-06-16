# 酒吧运营系统 - 技术设计文档

## 核心设计原则

### 1. 状态驱动的业务逻辑
所有关键实体（预约、低消、寄存、演出）都采用状态机模式管理，确保状态转换的合法性和可追溯性。

### 2. 全链路审计
每一次状态变更都会记录：
- 操作人（changedBy）
- 角色（changedByRole）
- 时间戳（timestamp）
- 变更原因（changeReason）
- 备注（notes）

### 3. 问题前置检测
系统在关键节点自动检测潜在问题：
- 预约重复检测（电话/桌台）
- 演出时间冲突检测
- 寄存酒状态异常检测
- 备注完整性检测

### 4. 角色化待办
根据业务场景自动分配待办：
- 新预约 → 经理待确认
- 预约确认 → 订台客服待低消确认
- 酒水异常 → 经理待处理
- 演出变更 → 受影响预约经理待通知

### 5. 备注传递机制
预约处理时的 `internalNotes` 会被持久化存储，并可在低消确认流程中访问和查看。

## 数据模型设计

### Reservation (预约核心表)
```typescript
{
  id: string,
  customerName: string,
  customerPhone: string,
  tableNumber: string,
  reservationDate: Date,
  reservationTime: string,
  partySize: number,
  status: ReservationStatus,
  minimumConsumptionAmount: number?,  // 低消金额
  minimumConsumptionStatus: MinimumConsumptionStatus?,  // 低消状态
  reservationStaffId: string,  // 创建人
  managerId: string?,  // 负责人
  notes: string?,  // 公开备注
  internalNotes: string?,  // 内部备注（传递到低消）
  priority: Priority,
  // ... 时间戳字段
}
```

**设计要点**:
- 低消信息直接存储在预约表中，减少关联查询
- `internalNotes` 字段实现备注传递
- `priority` 字段用于待办排序

### StatusHistory (状态变更表)
```typescript
{
  id: string,
  entityType: EntityType,  // reservation | minimum_consumption | beverage_storage | singer_schedule
  entityId: string,
  previousStatus: string?,
  newStatus: string,
  changedBy: string,
  changedByRole: StaffRole,
  changeReason: string?,
  notes: string?,
  timestamp: Date
}
```

**设计要点**:
- 通用表设计，支持所有实体类型的状态记录
- 记录完整的变更上下文（人、时、因、果）

### IssueDetection (问题检测表)
```typescript
{
  id: string,
  reservationId: string,
  issueType: IssueType,
  severity: Severity,
  description: string,
  relatedEntityId: string?,  // 关联实体
  resolved: boolean,
  resolvedAt: Date?,
  resolvedBy: string?,
  createdAt: Date
}
```

**设计要点**:
- 关联到预约，便于在预约详情中展示所有问题
- 支持问题解决流程
- 严重程度分级（warning/error/critical）

### TodoItem (待办事项表)
```typescript
{
  id: string,
  entityType: EntityType,
  entityId: string,
  assigneeRole: StaffRole,
  assigneeId: string?,
  title: string,
  description: string?,
  priority: Priority,
  status: TodoStatus,
  dueDate: Date?,
  createdAt: Date,
  updatedAt: Date
}
```

**设计要点**:
- 基于角色的分配机制
- 支持优先级和截止日期
- 关联具体业务实体

## 业务逻辑流程

### 预约创建流程
```
1. 接收创建请求
   ↓
2. 重复检测
   ├─ 电话重复? → 生成 warning 问题
   └─ 桌台冲突? → 生成 error 问题
   ↓
3. 创建预约记录 (status=pending)
   ↓
4. 记录状态历史 (null → pending)
   ↓
5. 创建经理待办 (新预约待确认)
   ↓
6. 返回结果 (包含检测结果和问题列表)
```

### 预约确认流程
```
1. 接收确认请求
   ↓
2. 验证当前状态 (必须是 pending)
   ↓
3. 更新预约状态 (pending → confirmed)
   ↓
4. 记录状态历史 (包含 internalNotes)
   ↓
5. 创建订台客服待办 (低消待确认)
   ├─ 携带 internalNotes
   └─ 优先级继承预约 priority
   ↓
6. 更新相关待办 (原待办 completed)
   ↓
7. 返回更新后的预约
```

### 低消确认流程
```
1. 接收低消确认请求
   ↓
2. 验证预约状态 (必须是 confirmed)
   ↓
3. 更新低消信息
   ├─ minimumConsumptionAmount
   └─ minimumConsumptionStatus
   ↓
4. 记录状态历史 (minimum_consumption 类型)
   ↓
5. 如果已确认 → 创建经理待办 (预约已确认)
   ↓
6. 返回更新结果
```

### 演出改期流程
```
1. 接收改期请求
   ↓
2. 冲突检测
   └─ 新时间段有其他排班? → 抛出错误
   ↓
3. 更新演出状态 (scheduled → rescheduled)
   ├─ 保存 originalDate
   └─ 更新 performanceDate
   ↓
4. 记录状态历史
   ↓
5. 查找受影响预约 (原日期)
   ↓
6. 为每个预约:
   ├─ 生成问题检测 (schedule_conflict)
   └─ 创建经理待办 (演出变更通知)
   ↓
7. 返回更新结果
```

## API 设计

### RESTful 原则
- 使用 HTTP 方法表达操作 (GET/POST/PUT/PATCH/DELETE)
- 使用路径表达资源层级
- 使用查询参数表达过滤条件
- 使用 HTTP 头传递上下文 (X-Staff-Id, X-Staff-Role)

### 头信息规范
```typescript
// 必需的头信息
X-Staff-Id: string  // 员工ID
X-Staff-Role: StaffRole  // 员工角色

// 特定角色的头信息
X-Manager-Id: string  // 经理操作时使用
X-Bar-Staff-Id: string  // 吧台操作时使用
```

### 错误处理
```typescript
// 统一错误格式
{
  error: string,  // 错误信息
  details?: any  // 详细信息（验证错误等）
}

// HTTP 状态码
200: 成功
201: 创建成功
400: 参数验证失败
401: 缺少认证信息
404: 资源不存在
409: 冲突（如时间冲突）
500: 服务器错误
```

## 关键实现细节

### 1. 状态机实现
```typescript
class ReservationService {
  private readonly statusTransitions = {
    pending: ['confirmed', 'cancelled', 'returned'],
    confirmed: ['in_progress', 'cancelled', 'returned'],
    in_progress: ['completed', 'cancelled'],
    completed: [],  // 终态
    cancelled: [],  // 终态
    returned: []  // 终态
  }

  canTransition(from: ReservationStatus, to: ReservationStatus): boolean {
    return this.statusTransitions[from]?.includes(to) || false
  }

  async transition(reservationId: string, to: ReservationStatus, ...args) {
    const current = await this.getStatus(reservationId)
    if (!this.canTransition(current, to)) {
      throw new Error(`非法状态转换: ${current} → ${to}`)
    }
    // 执行转换...
  }
}
```

### 2. 冲突检测实现
```typescript
class ConflictDetector {
  async checkReservationConflicts(
    phone: string,
    table: string,
    date: string,
    time: string,
    excludeId?: string
  ): Promise<ConflictCheckResult> {
    const issues: ConflictIssue[] = []

    // 1. 电话重复
    const phoneConflicts = await this.reservationRepo.findByPhoneAndDate(phone, date, excludeId)
    if (phoneConflicts.length > 0) {
      issues.push({
        type: 'phone_duplicate',
        severity: 'warning',
        message: `同一电话 ${phone} 在 ${date} 已有 ${phoneConflicts.length} 条预约`,
        relatedIds: phoneConflicts.map(r => r.id)
      })
    }

    // 2. 桌台冲突
    const tableConflicts = await this.reservationRepo.findByTableTimeDate(table, time, date, excludeId)
    if (tableConflicts.length > 0) {
      issues.push({
        type: 'table_conflict',
        severity: 'error',
        message: `桌台 ${table} 在 ${time} 已预约给 ${tableConflicts[0].customerName}`,
        relatedIds: tableConflicts.map(r => r.id)
      })
    }

    return {
      hasConflict: issues.length > 0,
      issues
    }
  }
}
```

### 3. 待办自动分配实现
```typescript
class TodoAssigner {
  assign(reservation: Reservation, action: ReservationAction): TodoItem[] {
    const todos: Partial<TodoItem>[] = []

    switch (action) {
      case 'create':
        todos.push({
          assigneeRole: 'manager',
          title: `新预约待确认: ${reservation.customerName}`,
          priority: reservation.priority,
          entityType: 'reservation',
          entityId: reservation.id
        })
        break

      case 'confirm':
        todos.push({
          assigneeRole: 'reservation_staff',
          title: `低消待确认: ${reservation.customerName}`,
          description: `内部备注: ${reservation.internalNotes || '无'}`,
          priority: reservation.priority,
          entityType: 'minimum_consumption',
          entityId: reservation.id
        })
        break

      case 'reject':
      case 'return':
        todos.push({
          assigneeRole: 'manager',
          title: `预约已${action === 'reject' ? '拒绝' : '退回'}: ${reservation.customerName}`,
          priority: 'low',
          entityType: 'reservation',
          entityId: reservation.id
        })
        break
    }

    return todos.map(t => this.todoRepo.create(t as any))
  }
}
```

## 扩展性设计

### 1. 新的问题类型
```typescript
// 在 types.ts 中添加
export const IssueType = z.enum([
  'duplicate_reservation',
  'beverage_unclear',
  'schedule_conflict',
  'minimum_consumption_pending',
  'notes_incomplete',
  'payment_overdue',  // 新增
  'capacity_warning'  // 新增
]);

// 在 IssueDetector 中实现
async detectPaymentOverdue(reservationId: string): Promise<IssueDetection?> {
  const reservation = await this.reservationRepo.findById(reservationId)
  if (reservation.status === 'confirmed' && 
      new Date() > new Date(reservation.reservationDate) &&
      reservation.minimumConsumptionStatus !== 'confirmed') {
    return {
      reservationId,
      issueType: 'payment_overdue',
      severity: 'error',
      description: '预约日期已过但低消未确认'
    }
  }
}
```

### 2. 新的待办规则
```typescript
// 在 TodoRules 中添加
const todoRules: TodoRule[] = [
  // 现有规则...
  {
    trigger: 'reservation_date_approaching',
    condition: (r) => {
      const daysUntil = differenceInDays(new Date(r.reservationDate), new Date())
      return daysUntil <= 1 && daysUntil >= 0
    },
    assigneeRole: 'reservation_staff',
    title: (r) => `明日预约提醒: ${r.customerName}`,
    priority: 'high'
  }
]
```

### 3. 新的状态变更
```typescript
// 在 StatusHistoryRepository 中已支持任意实体类型
await historyRepo.create({
  entityType: 'payment',  // 新实体
  entityId: payment.id,
  previousStatus: 'pending',
  newStatus: 'completed',
  changedBy: staffId,
  changedByRole: staffRole,
  changeReason: '支付完成',
  notes: payment.notes
})
```

## 监控和日志

### 关键指标
1. **预约创建成功率**: /api/reservations POST 成功率
2. **问题检测率**: 包含问题的预约占比
3. **待办完成率**: 各角色待办按时完成率
4. **状态转换频率**: 各状态间的转换次数

### 日志记录
```typescript
// 请求日志
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log({
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration,
      staffId: req.headers['x-staff-id'],
      staffRole: req.headers['x-staff-role']
    })
  })
  next()
})

// 业务日志
async function processReservation(...) {
  logger.info('处理预约', {
    reservationId,
    action,
    staffId,
    staffRole,
    timestamp: new Date()
  })
  // 业务逻辑...
  logger.info('预约处理完成', {
    reservationId,
    newStatus,
    todosCreated: todoIds.length,
    issuesDetected: issueIds.length
  })
}
```

## 安全性考虑

### 1. 角色权限控制
```typescript
const rolePermissions = {
  reservation_staff: ['reservations:read', 'reservations:create', 'minimum_consumption:update', 'todos:read', 'todos:update'],
  bar_staff: ['beverage_storage:read', 'beverage_storage:create', 'beverage_storage:update', 'todos:read', 'todos:update'],
  manager: ['*']  // 全部权限
}

function checkPermission(role: StaffRole, resource: string, action: string): boolean {
  const permissions = rolePermissions[role]
  return permissions.includes('*') || permissions.includes(`${resource}:${action}`)
}
```

### 2. 数据隔离
```typescript
// 待办查询按角色过滤
router.get('/todos', (req, res) => {
  const role = req.query.role as StaffRole
  const todos = todoService.getByRole(role)
  // 确保只返回该角色的待办
  res.json(todos.filter(t => t.assigneeRole === role))
})

// 敏感操作记录
async function sensitiveOperation(reservationId: string, staffId: string) {
  logger.warn('敏感操作', {
    reservationId,
    staffId,
    operation: '状态强制变更',
    timestamp: new Date()
  })
}
```

## 部署建议

### 1. 环境配置
```bash
# .env.production
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
DB_PATH=/var/lib/bar-operations/bar_operations.db
```

### 2. 进程管理
```bash
# 使用 PM2
pm2 start src/index.ts \
  --name bar-api \
  --interpreter tsx \
  --watch \
  --max-memory-restart 500M
```

### 3. 健康检查
```bash
curl http://localhost:3000/api/health
# 响应
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### 4. 数据备份
```bash
# 每日备份
0 2 * * * cp /var/lib/bar-operations/bar_operations.db /backup/bar_operations_$(date +\%Y\%m\%d).db
```

## 性能优化

### 1. 数据库优化
```sql
-- 已创建的索引
CREATE INDEX idx_reservations_date ON reservations(reservation_date);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_table ON reservations(table_number);
CREATE INDEX idx_beverage_reservation ON beverage_storage(reservation_id);
CREATE INDEX idx_status_history_entity ON status_history(entity_type, entity_id);
CREATE INDEX idx_todo_assignee ON todo_items(assignee_role, status);
CREATE INDEX idx_issues_reservation ON issue_detections(reservation_id, resolved);

-- 查询优化示例
EXPLAIN QUERY PLAN
SELECT * FROM reservations
WHERE reservation_date = '2024-01-15'
AND status = 'pending'
ORDER BY priority, created_at
LIMIT 20;
```

### 2. 缓存策略
```typescript
// 热点数据缓存
const cache = new Map<string, { data: any; expiry: number }>()

async function getReservationsWithCache(filters) {
  const cacheKey = JSON.stringify(filters)
  const cached = cache.get(cacheKey)
  
  if (cached && cached.expiry > Date.now()) {
    return cached.data
  }
  
  const data = await reservationService.getReservations(filters)
  cache.set(cacheKey, { data, expiry: Date.now() + 60000 })  // 1分钟缓存
  
  return data
}
```

### 3. 分页处理
```typescript
// 默认分页
const DEFAULT_PAGE_SIZE = 20
const MAX_PAGE_SIZE = 100

router.get('/reservations', (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1)
  const limit = Math.min(MAX_PAGE_SIZE, parseInt(req.query.limit) || DEFAULT_PAGE_SIZE)
  const offset = (page - 1) * limit
  
  const data = reservationService.getPaginated({ page, limit, offset })
  
  res.json({
    data: data.items,
    pagination: {
      page,
      limit,
      total: data.total,
      totalPages: Math.ceil(data.total / limit)
    }
  })
})
```

## 测试策略

### 1. 单元测试
```typescript
// tests/services/reservation.test.ts
describe('ReservationService', () => {
  describe('checkDuplicateReservations', () => {
    it('should detect phone duplicates', async () => {
      // Setup
      await createReservation({ customerPhone: '13900139000', reservationDate: '2024-01-15' })
      
      // Execute
      const result = service.checkDuplicateReservations(
        '13900139000',
        '2024-01-15',
        'A01',
        '20:00'
      )
      
      // Assert
      expect(result.hasDuplicate).toBe(true)
      expect(result.conflictType).toBe('phone')
    })
    
    it('should detect table conflicts', async () => {
      // Setup
      await createReservation({ tableNumber: 'A01', reservationDate: '2024-01-15', reservationTime: '20:00' })
      
      // Execute
      const result = service.checkDuplicateReservations(
        '13900139001',
        '2024-01-15',
        'A01',
        '20:00'
      )
      
      // Assert
      expect(result.hasDuplicate).toBe(true)
      expect(result.conflictType).toBe('table')
    })
  })
})
```

### 2. 集成测试
```typescript
// tests/api/reservations.test.ts
describe('POST /api/reservations', () => {
  it('should create reservation with duplicate detection', async () => {
    // Create first reservation
    const res1 = await request(app)
      .post('/api/reservations')
      .send({ customerPhone: '13900139000', ... })
    
    expect(res1.status).toBe(201)
    
    // Create duplicate
    const res2 = await request(app)
      .post('/api/reservations')
      .send({ customerPhone: '13900139000', ... })
    
    expect(res2.status).toBe(201)
    expect(res2.body.duplicateCheck.hasDuplicate).toBe(true)
    expect(res2.body.issues.length).toBeGreaterThan(0)
  })
})
```

### 3. 端到端测试
```typescript
// tests/e2e/reservation-flow.test.ts
it('complete reservation flow', async () => {
  // 1. Create reservation
  const reservation = await createReservation({ ... })
  
  // 2. Manager confirms
  await processReservation(reservation.id, 'confirm', { role: 'manager' })
  
  // 3. Staff confirms minimum consumption
  await updateMinimumConsumption(reservation.id, { amount: 2000, status: 'confirmed' })
  
  // 4. Verify all status history
  const history = await getStatusHistory(reservation.id)
  expect(history.length).toBe(3)  // create, confirm reservation, confirm minimum
  
  // 5. Verify todos completed
  const todos = await getTodos({ role: 'reservation_staff' })
  const completed = todos.filter(t => t.entityId === reservation.id && t.status === 'completed')
  expect(completed.length).toBe(1)
})
```
