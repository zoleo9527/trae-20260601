import type { NextPage } from 'next';
import Layout from '@/components/Layout';

const Docs: NextPage = () => {
  return (
    <Layout activeTab="docs">
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>验收说明文档</h1>

        {/* 模型关系 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>一、模型关系图</h2>
          <pre style={styles.codeBlock}>
{`┌─────────────────────────────────────────────────────────┐
│                  RecyclingOrder (1)                     │
├─────────────────────────────────────────────────────────┤
│ id, orderNo, status, urgency, source                   │
│ customerName, customerPhone, customerIdCard            │
│ createdAt, updatedAt, completedAt                      │
│ currentValuationId → 指向当前生效的 Valuation          │
└─────────────┬──────────────────────────────┬────────────┘
              │                              │
              │ 1:N                          │ 1:N
              ▼                              ▼
┌──────────────────────────────┐  ┌─────────────────────────────┐
│      Valuation (*)           │  │  CustomerConfirmation (*)   │
├──────────────────────────────┤  ├─────────────────────────────┤
│ id, version, status          │  │ id, status, method          │
│ estimatedPrice, minPrice     │  │ confirmedPrice              │
│ maxPrice, valuationNotes     │  │ objectionContent            │
│ inspectionItems {6项}        │  │ initiatedBy, confirmedAt    │
│ parentValuationId → 上一版本 │  │ seenValuationRemarks[]      │
│ processorId, approverId      │  └─────────────────────────────┘
│ remarks: ValuationRemark[]   │
└──────────────┬───────────────┘
               │ 1:N
               ▼
┌──────────────────────────────┐
│   ValuationRemark (*)        │
├──────────────────────────────┤
│ id, content, authorRole      │
│ authorId, authorName         │
│ timestamp                    │
│ isVisibleToCustomer (关键!)  │
│ isCritical                   │
└──────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                       AuditLog                          │
├─────────────────────────────────────────────────────────┤
│ id, orderId, action, operatorRole, operatorId           │
│ operatorName, oldValue, newValue, timestamp             │
│ idempotencyKey                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                    IdempotentRecord                     │
├─────────────────────────────────────────────────────────┤
│ idempotencyKey, path, method, timestamp, response       │
└─────────────────────────────────────────────────────────┘`}
          </pre>
        </section>

        {/* 状态约束 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>二、状态约束与转移规则</h2>
          
          <h3 style={styles.subTitle}>2.1 回收单状态机</h3>
          <div style={styles.statusGrid}>
            {[
              {
                status: 'DRAFT (草稿)',
                color: '#6b7280',
                next: 'PENDING_VALUATION / CANCELLED',
                role: 'RECEPTIONIST / MANAGER',
              },
              {
                status: 'PENDING_VALUATION (待估价)',
                color: '#f59e0b',
                next: 'VALUATED / CANCELLED',
                role: 'PROCESSOR / MANAGER',
              },
              {
                status: 'VALUATED (已估价)',
                color: '#3b82f6',
                next: 'PENDING_CONFIRMATION / RE_VALUATED',
                role: 'RECEPTIONIST / PROCESSOR',
              },
              {
                status: 'PENDING_CONFIRMATION (待确认)',
                color: '#8b5cf6',
                next: 'CONFIRMED / OBJECTED / EXPIRED',
                role: 'RECEPTIONIST / MANAGER',
              },
              {
                status: 'OBJECTED (有异议)',
                color: '#dc2626',
                next: 'RE_VALUATED',
                role: 'PROCESSOR / MANAGER',
              },
              {
                status: 'RE_VALUATED (已重估)',
                color: '#2563eb',
                next: 'PENDING_CONFIRMATION',
                role: 'RECEPTIONIST',
              },
              {
                status: 'CONFIRMED (已确认)',
                color: '#059669',
                next: 'COMPLETED',
                role: 'RECEPTIONIST / MANAGER',
              },
              {
                status: 'COMPLETED (已完成)',
                color: '#10b981',
                next: '（终态）',
                role: '-',
              },
              {
                status: 'CANCELLED (已取消)',
                color: '#6b7280',
                next: '（终态）',
                role: '-',
              },
              {
                status: 'EXPIRED (已过期)',
                color: '#9ca3af',
                next: '（终态）',
                role: '-',
              },
            ].map((item, i) => (
              <div key={i} style={styles.statusCard}>
                <div style={styles.statusCardHeader}>
                  <span
                    style={{
                      ...styles.statusDot,
                      background: item.color,
                    }}
                  />
                  <span style={styles.statusName}>{item.status}</span>
                </div>
                <div style={styles.statusInfo}>
                  <div>
                    <span style={styles.statusLabel}>可转移至：</span>
                    <span style={styles.statusValue}>{item.next}</span>
                  </div>
                  <div>
                    <span style={styles.statusLabel}>操作角色：</span>
                    <span style={styles.statusValue}>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={styles.subTitle}>2.2 估价状态机</h3>
          <div style={styles.statusGrid}>
            {[
              {
                status: 'DRAFT (草稿)',
                color: '#6b7280',
                next: 'SUBMITTED',
                role: 'PROCESSOR',
              },
              {
                status: 'SUBMITTED (待审批)',
                color: '#f59e0b',
                next: 'APPROVED / REJECTED',
                role: 'MANAGER',
              },
              {
                status: 'APPROVED (已通过)',
                color: '#059669',
                next: '（终态）',
                role: '-',
              },
              {
                status: 'REJECTED (已拒绝)',
                color: '#dc2626',
                next: 'DRAFT（重新编辑）',
                role: 'PROCESSOR',
              },
            ].map((item, i) => (
              <div key={i} style={styles.statusCard}>
                <div style={styles.statusCardHeader}>
                  <span
                    style={{
                      ...styles.statusDot,
                      background: item.color,
                    }}
                  />
                  <span style={styles.statusName}>{item.status}</span>
                </div>
                <div style={styles.statusInfo}>
                  <div>
                    <span style={styles.statusLabel}>可转移至：</span>
                    <span style={styles.statusValue}>{item.next}</span>
                  </div>
                  <div>
                    <span style={styles.statusLabel}>操作角色：</span>
                    <span style={styles.statusValue}>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <h3 style={styles.subTitle}>2.3 确认状态机</h3>
          <div style={styles.statusGrid}>
            {[
              {
                status: 'PENDING (待确认)',
                color: '#f59e0b',
                next: 'CONFIRMED / OBJECTED / EXPIRED',
                role: 'RECEPTIONIST',
              },
              {
                status: 'CONFIRMED (已确认)',
                color: '#059669',
                next: '（终态）',
                role: '-',
              },
              {
                status: 'OBJECTED (有异议)',
                color: '#dc2626',
                next: '（终态）',
                role: '-',
              },
              {
                status: 'EXPIRED (已过期)',
                color: '#9ca3af',
                next: '（终态）',
                role: '-',
              },
            ].map((item, i) => (
              <div key={i} style={styles.statusCard}>
                <div style={styles.statusCardHeader}>
                  <span
                    style={{
                      ...styles.statusDot,
                      background: item.color,
                    }}
                  />
                  <span style={styles.statusName}>{item.status}</span>
                </div>
                <div style={styles.statusInfo}>
                  <div>
                    <span style={styles.statusLabel}>可转移至：</span>
                    <span style={styles.statusValue}>{item.next}</span>
                  </div>
                  <div>
                    <span style={styles.statusLabel}>操作角色：</span>
                    <span style={styles.statusValue}>{item.role}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 验收要点 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>三、接口验收要点</h2>

          <div style={styles.checkList}>
            <div style={styles.checkSection}>
              <h3 style={styles.checkTitle}>3.1 幂等提交</h3>
              <div style={styles.checkItemWrap}>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>所有写操作必须携带 <code>X-Idempotency-Key</code> 请求头</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>相同幂等键重复请求返回相同响应，不重复执行业务</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>幂等键记录在 <code>IdempotentRecord</code> 中，包含完整响应内容</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>前端自动生成幂等键：时间戳+随机字符串</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>校验点：连续两次提交相同内容，第二次返回"重复请求"，不新增数据</span>
                </div>
              </div>
            </div>

            <div style={styles.checkSection}>
              <h3 style={styles.checkTitle}>3.2 审计日志</h3>
              <div style={styles.checkItemWrap}>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>每一次写操作都记录 <code>AuditLog</code>，包含新旧值对比</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>审计日志字段：<code>action</code>、<code>operatorRole</code>、<code>oldValue</code>、<code>newValue</code>、<code>idempotencyKey</code></span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>审计日志仅 <code>PROCESSOR</code> 和 <code>MANAGER</code> 角色可查看</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>API：<code>GET /api/orders/[id]/audit</code></span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>校验点：修改订单状态后，查询审计日志能看到操作记录</span>
                </div>
              </div>
            </div>

            <div style={styles.checkSection}>
              <h3 style={styles.checkTitle}>3.3 客户确认回看</h3>
              <div style={styles.checkItemWrap}>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span><code>CustomerConfirmation</code> 记录 <code>seenValuationRemarks</code> 追踪客户已查看的备注ID</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>只有 <code>isVisibleToCustomer = true</code> 的备注会展示给客户</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>确认历史按时间倒序展示，可切换查看每次确认详情</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>异议内容、确认价格、确认方式都有记录</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>校验点：发起确认 → 标记备注已查看 → 确认，回看时能看到已查看标记</span>
                </div>
              </div>
            </div>

            <div style={styles.checkSection}>
              <h3 style={styles.checkTitle}>3.4 回收估价处理</h3>
              <div style={styles.checkItemWrap}>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>估价按 <code>version</code> 字段版本化管理，<code>parentValuationId</code> 形成版本链</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>支持创建估价、重新估价、提交审批、审批通过/拒绝</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>备注支持三种可见性：客户可见 / 内部可见 / 关键备注</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>API：<code>POST /api/orders/[id]/valuation?action=create|revaluate|submit|approve|reject|add_remark</code></span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>校验点：对异议订单重新估价后，新版本的备注会流转到客户确认页</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 角色入口 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>四、角色入口说明</h2>
          
          <div style={styles.roleGrid}>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>👩‍💼</div>
              <h3 style={styles.roleName}>前台</h3>
              <div style={styles.roleCode}>RECEPTIONIST</div>
              <div style={styles.roleDesc}>
                负责接待客户、创建回收单、发起客户确认、记录客户异议、完成回收
              </div>
              <div style={styles.roleEntry}>
                <span style={styles.roleEntryLabel}>入口：</span>
                <code style={styles.roleLink}>/receptionist</code>
              </div>
              <div style={styles.rolePages}>
                <strong>相关页面：</strong>
                <ul>
                  <li>工作台：<code>/receptionist</code></li>
                  <li>客户确认详情：<code>/receptionist/confirm/[id]</code></li>
                </ul>
              </div>
              <div style={styles.roleActions}>
                <strong>常用动作：</strong>
                <ul>
                  <li>📝 创建回收单</li>
                  <li>📢 发起客户确认</li>
                  <li>✅ 客户确认接受价格</li>
                  <li>❌ 记录客户异议</li>
                  <li>👁️ 标记客户已查看备注</li>
                  <li>🎉 完成回收</li>
                </ul>
              </div>
            </div>

            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>🔧</div>
              <h3 style={styles.roleName}>处理人员</h3>
              <div style={styles.roleCode}>PROCESSOR</div>
              <div style={styles.roleDesc}>
                负责设备检测、创建估价、重新估价、提交审批、添加估价备注
              </div>
              <div style={styles.roleEntry}>
                <span style={styles.roleEntryLabel}>入口：</span>
                <code style={styles.roleLink}>/processor</code>
              </div>
              <div style={styles.rolePages}>
                <strong>相关页面：</strong>
                <ul>
                  <li>工作台：<code>/processor</code></li>
                  <li>估价详情：<code>/processor/valuation/[id]</code></li>
                </ul>
              </div>
              <div style={styles.roleActions}>
                <strong>常用动作：</strong>
                <ul>
                  <li>💰 创建估价</li>
                  <li>🔄 重新估价（针对异议）</li>
                  <li>📤 提交审批</li>
                  <li>📝 添加估价备注（控制可见性）</li>
                  <li>📜 查看审计日志</li>
                </ul>
              </div>
            </div>

            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>👔</div>
              <h3 style={styles.roleName}>店长</h3>
              <div style={styles.roleCode}>MANAGER</div>
              <div style={styles.roleDesc}>
                负责审批估价、查看全局数据、查看审计日志、异常状态处理
              </div>
              <div style={styles.roleEntry}>
                <span style={styles.roleEntryLabel}>入口：</span>
                <code style={styles.roleLink}>/manager</code>
              </div>
              <div style={styles.rolePages}>
                <strong>相关页面：</strong>
                <ul>
                  <li>工作台：<code>/manager</code></li>
                  <li>订单详情：<code>/manager/order/[id]</code>（待实现）</li>
                </ul>
              </div>
              <div style={styles.roleActions}>
                <strong>常用动作：</strong>
                <ul>
                  <li>✅ 审批通过估价</li>
                  <li>❌ 审批拒绝估价</li>
                  <li>📊 查看回收总额统计</li>
                  <li>📜 查看审计日志</li>
                  <li>⚠️ 处理异常订单</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 模拟数据位置 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>五、模拟数据位置</h2>
          
          <div style={styles.dataSection}>
            <div style={styles.dataLocation}>
              <strong>数据层文件：</strong>
              <code style={styles.dataCode}>src/data/database.ts</code>
            </div>
            
            <h4 style={styles.subTitle}>5.1 种子数据（5条订单）</h4>
            <div style={styles.seedList}>
              {[
                {
                  no: '订单1',
                  device: 'iPhone 15 Pro',
                  status: 'PENDING_VALUATION',
                  desc: '待估价，新创建的订单，模拟正常流程起点',
                },
                {
                  no: '订单2',
                  device: 'MacBook Pro 14',
                  status: 'PENDING_CONFIRMATION',
                  desc: '估价已完成，待客户确认，模拟客户在场场景',
                },
                {
                  no: '订单3',
                  device: '华为Mate 60 Pro',
                  status: 'OBJECTED',
                  desc: '⭐ 客户有异议，价格太低，需要重新估价。已包含可见备注"屏幕有划痕需扣除200元"，模拟现场压力场景',
                },
                {
                  no: '订单4',
                  device: 'iPad Pro 12.9',
                  status: 'CONFIRMED',
                  desc: '客户已确认，待完成回收',
                },
                {
                  no: '订单5',
                  device: 'AirPods Pro 2',
                  status: 'COMPLETED',
                  desc: '已完成的历史订单，用于历史回看演示',
                },
              ].map((item, i) => (
                <div key={i} style={styles.seedItem}>
                  <div style={styles.seedHeader}>
                    <span style={styles.seedNo}>{item.no}</span>
                    <span style={styles.seedDevice}>{item.device}</span>
                    <span
                      style={{
                        ...styles.seedStatus,
                        background:
                          item.status === 'OBJECTED' ? '#fef2f2' : '#f0fdf4',
                        color:
                          item.status === 'OBJECTED' ? '#dc2626' : '#059669',
                      }}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div style={styles.seedDesc}>{item.desc}</div>
                </div>
              ))}
            </div>

            <h4 style={styles.subTitle}>5.2 数据存储说明</h4>
            <div style={styles.dataNote}>
              <p>• 使用内存 <code>Map</code> 存储，服务重启数据会重置</p>
              <p>• <code>Database</code> 类是单例模式，通过 <code>getInstance()</code> 获取实例</p>
              <p>• 种子数据在 <code>initializeSeedData()</code> 方法中初始化</p>
              <p>• 幂等键存储在 <code>idempotentRecords</code> Map 中，键为 <code>{method}:{path}:{key}</code></p>
            </div>
          </div>
        </section>

        {/* 暂未实现的集成点 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>六、暂未实现的集成点</h2>
          
          <div style={styles.todoList}>
            {[
              {
                priority: '高',
                title: '店长订单详情页',
                path: '/pages/manager/order/[id].tsx',
                desc: '店长视角的订单全览，包含估价历史、确认历史、审计日志',
              },
              {
                priority: '高',
                title: '新建回收单页面',
                path: '/pages/*/create.tsx',
                desc: '前台创建新回收单的表单，包含设备信息录入、拍照上传',
              },
              {
                priority: '高',
                title: '审计日志查看页',
                path: '/pages/audit/[id].tsx',
                desc: '独立的审计日志查看页面，支持按操作人、操作类型筛选',
              },
              {
                priority: '中',
                title: '设备图片上传',
                path: 'API /api/orders/[id]/images',
                desc: '设备故障照片、成色照片上传，关联到估价版本',
              },
              {
                priority: '中',
                title: '客户确认签名',
                path: 'API /api/orders/[id]/signature',
                desc: '电子签名功能，客户确认时签名留存',
              },
              {
                priority: '中',
                title: '短信/微信通知',
                path: '服务层 notification.service.ts',
                desc: '估价完成、异议处理完成后通知客户',
              },
              {
                priority: '中',
                title: '价格参考库',
                path: '数据层 price-reference.ts',
                desc: '各型号设备的参考回收价格，辅助估价人员定价',
              },
              {
                priority: '低',
                title: '导出台账',
                path: 'API /api/export/orders',
                desc: '导出Excel格式的回收台账，替代旧台账',
              },
              {
                priority: '低',
                title: '实时消息推送',
                path: 'WebSocket /ws',
                desc: '新订单、异议产生时实时推送给处理人员',
              },
              {
                priority: '低',
                title: '持久化存储',
                path: '集成 PostgreSQL + Prisma',
                desc: '当前使用内存Map，生产环境需要替换为真实数据库',
              },
              {
                priority: '低',
                title: '用户认证系统',
                path: '集成 NextAuth / OIDC',
                desc: '当前使用模拟用户上下文，生产环境需要真实登录',
              },
              {
                priority: '低',
                title: '权限管理系统',
                path: '数据层 rbac.ts',
                desc: '更细粒度的权限控制，支持自定义角色',
              },
            ].map((item, i) => (
              <div key={i} style={styles.todoItem}>
                <div style={styles.todoLeft}>
                  <span
                    style={{
                      ...styles.todoPriority,
                      background:
                        item.priority === '高'
                          ? '#fef2f2'
                          : item.priority === '中'
                          ? '#fef3c7'
                          : '#f3f4f6',
                      color:
                        item.priority === '高'
                          ? '#dc2626'
                          : item.priority === '中'
                          ? '#92400e'
                          : '#4b5563',
                    }}
                  >
                    {item.priority}
                  </span>
                  <span style={styles.todoTitle}>{item.title}</span>
                </div>
                <div style={styles.todoPath}>
                  <code>{item.path}</code>
                </div>
                <div style={styles.todoDesc}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 快速测试路径 */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>七、快速测试路径</h2>
          
          <div style={styles.testPath}>
            <h4 style={styles.subTitle}>路径1：正常流程（订单2）</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>前台</strong> 登录 → 进入订单2详情</li>
                <li>点击"发起客户确认" → 状态变为 PENDING_CONFIRMATION</li>
                <li>如果有可见备注，先点击"客户已查看全部备注"</li>
                <li>点击"客户确认接受价格" → 状态变为 CONFIRMED</li>
                <li>点击"完成回收" → 状态变为 COMPLETED</li>
              </ol>
            </div>

            <h4 style={styles.subTitle}>路径2：异议-重估流程（订单3 ⭐ 推荐）</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>前台</strong> 登录 → 进入订单3详情</li>
                <li>查看客户异议内容："价格太低，别家报价更高"</li>
                <li>切换到 <strong>处理人员</strong> 登录 → 进入订单3估价详情</li>
                <li>查看之前的估价版本和备注</li>
                <li>点击"重新估价" → 调整价格（比如从4200调到4500）</li>
                <li>添加一条可见备注："客户异议后调整价格至4500元，已达上限"</li>
                <li>提交审批 → 切换到 <strong>店长</strong> 审批通过</li>
                <li>切换回 <strong>前台</strong> → 状态变为 RE_VALUATED</li>
                <li>发起客户确认 → 客户能看到新的价格和备注</li>
                <li>确认接受 → 完成</li>
              </ol>
              <p style={styles.testNote}>
                💡 此路径可验证：<strong>备注流转</strong>、<strong>估价版本</strong>、<strong>异议处理</strong>、
                <strong>状态机约束</strong>、<strong>角色权限</strong> 五个核心特性
              </p>
            </div>

            <h4 style={styles.subTitle}>路径3：幂等性验证</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>在浏览器开发者工具中开启"网络"面板</li>
                <li>执行任意写操作（如修改状态）</li>
                <li>找到对应的请求，复制请求体和 <code>X-Idempotency-Key</code> 头</li>
                <li>使用 curl 或 Postman 重复发送相同的请求</li>
                <li>第二次请求应返回相同响应，但不产生新的审计日志</li>
              </ol>
            </div>

            <h4 style={styles.subTitle}>路径4：审计日志验证</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>处理人员</strong> 或 <strong>店长</strong> 登录</li>
                <li>对某个订单执行几次操作（如添加备注、修改状态）</li>
                <li>调用 API：<code>GET /api/orders/[id]/audit</code></li>
                <li>验证每条操作都有对应的审计日志，包含新旧值</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    paddingBottom: '60px',
  },
  pageTitle: {
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: '32px',
    textAlign: 'center',
  },
  section: {
    marginBottom: '40px',
    background: 'white',
    borderRadius: '12px',
    padding: '28px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 20px 0',
    paddingBottom: '12px',
    borderBottom: '2px solid #e5e7eb',
  },
  subTitle: {
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#374151',
    margin: '24px 0 12px 0',
  },
  codeBlock: {
    background: '#1f2937',
    color: '#e5e7eb',
    padding: '20px',
    borderRadius: '10px',
    fontSize: '12px',
    lineHeight: '1.6',
    overflowX: 'auto',
    fontFamily: 'Menlo, Monaco, monospace',
  },
  statusGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
    gap: '12px',
    marginBottom: '16px',
  },
  statusCard: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '14px',
    border: '1px solid #e5e7eb',
  },
  statusCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '10px',
  },
  statusDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  statusName: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  statusInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  statusLabel: {
    fontSize: '11px',
    color: '#6b7280',
    marginRight: '4px',
  },
  statusValue: {
    fontSize: '12px',
    color: '#374151',
    fontWeight: '500',
  },
  checkList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  checkSection: {
    background: '#f9fafb',
    borderRadius: '10px',
    padding: '18px',
    border: '1px solid #e5e7eb',
  },
  checkTitle: {
    fontSize: '15px',
    fontWeight: 'bold',
    color: '#1f2937',
    margin: '0 0 12px 0',
  },
  checkItemWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  checkItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px',
    fontSize: '13px',
    color: '#374151',
    lineHeight: '1.6',
  },
  checkMark: {
    color: '#059669',
    fontWeight: 'bold',
    flexShrink: 0,
    marginTop: '1px',
  },
  roleGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '16px',
  },
  roleCard: {
    background: '#f9fafb',
    borderRadius: '12px',
    padding: '20px',
    border: '1px solid #e5e7eb',
  },
  roleIcon: {
    fontSize: '36px',
    textAlign: 'center',
    marginBottom: '8px',
  },
  roleName: {
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'center',
    margin: '0 0 4px 0',
  },
  roleCode: {
    textAlign: 'center',
    fontSize: '12px',
    color: '#6b7280',
    fontFamily: 'monospace',
    marginBottom: '12px',
  },
  roleDesc: {
    fontSize: '13px',
    color: '#4b5563',
    lineHeight: '1.6',
    marginBottom: '12px',
  },
  roleEntry: {
    fontSize: '13px',
    color: '#374151',
    marginBottom: '12px',
  },
  roleEntryLabel: {
    color: '#6b7280',
  },
  roleLink: {
    background: '#eff6ff',
    color: '#2563eb',
    padding: '2px 6px',
    borderRadius: '4px',
    fontFamily: 'monospace',
  },
  rolePages: {
    marginBottom: '12px',
    fontSize: '13px',
    color: '#374151',
  },
  roleActions: {
    fontSize: '13px',
    color: '#374151',
  },
  roleActionsUl: {
    margin: '8px 0 0 0',
    paddingLeft: '20px',
  },
  dataSection: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.7',
  },
  dataLocation: {
    marginBottom: '16px',
    fontSize: '14px',
  },
  dataCode: {
    background: '#f3f4f6',
    padding: '3px 8px',
    borderRadius: '4px',
    fontFamily: 'monospace',
    marginLeft: '8px',
  },
  seedList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    marginBottom: '20px',
  },
  seedItem: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '14px',
    border: '1px solid #e5e7eb',
  },
  seedHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '6px',
    flexWrap: 'wrap',
  },
  seedNo: {
    fontWeight: 'bold',
    color: '#1f2937',
    fontSize: '14px',
  },
  seedDevice: {
    color: '#374151',
    fontSize: '14px',
  },
  seedStatus: {
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  seedDesc: {
    fontSize: '13px',
    color: '#6b7280',
  },
  dataNote: {
    background: '#fffbeb',
    borderRadius: '8px',
    padding: '14px 18px',
    border: '1px solid #fcd34d',
  },
  todoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  todoItem: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '14px',
    border: '1px solid #e5e7eb',
  },
  todoLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '6px',
  },
  todoPriority: {
    padding: '2px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 'bold',
  },
  todoTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#1f2937',
  },
  todoPath: {
    marginBottom: '4px',
  },
  todoDesc: {
    fontSize: '13px',
    color: '#6b7280',
    lineHeight: '1.6',
  },
  testPath: {
    fontSize: '14px',
    color: '#374151',
    lineHeight: '1.7',
  },
  testSteps: {
    background: '#f9fafb',
    borderRadius: '8px',
    padding: '16px 20px',
    marginBottom: '16px',
  },
  testNote: {
    marginTop: '10px',
    padding: '10px 14px',
    background: '#f0fdf4',
    borderRadius: '6px',
    color: '#166534',
    fontSize: '13px',
  },
};

export default Docs;
