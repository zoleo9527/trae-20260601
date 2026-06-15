import type { NextPage } from 'next';
import Layout from '@/components/Layout';

const Docs: NextPage = () => {
  return (
    <Layout activeTab="docs">
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>验收说明文档</h1>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>一、模型关系图</h2>
          <pre style={styles.codeBlock}>
{`┌──────────────────────────────────────────────────────────────┐
│                    RecyclingOrder (1)                        │
├──────────────────────────────────────────────────────────────┤
│ id, orderNo, status, urgency, source                        │
│ receptionistId, receptionistName                            │
│ customerName, customerPhone, customerIdCard                 │
│ currentValuationId → 指向当前生效的 Valuation               │
│ finalPrice, createdAt, updatedAt, completedAt               │
│ cancelledAt, cancelReason, tags[]                           │
└─────────────┬────────────────────────────┬──────────────────┘
              │                            │
              │ 1:N                        │ 1:N
              ▼                            ▼
┌──────────────────────────────┐  ┌─────────────────────────────────────┐
│      Valuation (*)           │  │        CustomerConfirmation (*)      │
├──────────────────────────────┤  ├─────────────────────────────────────┤
│ id, version, status          │  │ id, status                          │
│ estimatedPrice, minPrice     │  │ valuationId → 关联估价(关键)         │
│ maxPrice                     │  │ confirmationMethod: ON_SITE/ONLINE/  │
│ inspectionItems {7项}        │  │                    PHONE (非method)  │
│ parentValuationId → 上一版本 │  │ confirmedPrice, confirmedAt         │
│ processorId, processorName   │  │ objectionContent, objectionPhotos[] │
│ submittedAt, approvedAt      │  │ signature, expiredAt, createdAt     │
│ approvedBy, remarks[]        │  │ seenValuationRemarks[] (初始为空)    │
│ photos[]                     │  │ customerName, customerPhone          │
│                              │  │ customerIdCard (可选)               │
└──────────────┬───────────────┘  └─────────────────────────────────────┘
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

┌──────────────────────────────────────────────────────────────┐
│                         AuditLog                             │
├──────────────────────────────────────────────────────────────┤
│ id, orderId, action                                          │
│ actorRole, actorId, actorName (非operator)                   │
│ oldValue, newValue, field                                    │
│ timestamp, ipAddress, userAgent                              │
│ idempotencyKey                                               │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│                      IdempotentRecord                        │
├──────────────────────────────────────────────────────────────┤
│ key (非idempotencyKey), action, orderId                      │
│ timestamp, response                                          │
└──────────────────────────────────────────────────────────────┘

关键关联：
  CustomerConfirmation.valuationId → Valuation.id
    选择确认记录时，回看该记录关联的估价、备注查看状态和异议信息
  CustomerConfirmation.seenValuationRemarks[] → ValuationRemark.id[]
    追踪客户在该次确认中已查看的备注，初始为空，需前台手动标记`}
          </pre>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>二、状态约束与转移规则</h2>

          <h3 style={styles.subTitle}>2.1 回收单状态机（RecyclingOrderStatus）</h3>
          <div style={styles.statusGrid}>
            {[
              {
                status: 'DRAFT (待提交)',
                color: '#9ca3af',
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
                status: 'VALUATED (估价完成)',
                color: '#3b82f6',
                next: 'PENDING_CONFIRMATION / REJECTED / CANCELLED',
                role: 'RECEPTIONIST / MANAGER',
              },
              {
                status: 'PENDING_CONFIRMATION (待客户确认)',
                color: '#8b5cf6',
                next: 'CONFIRMED / OBJECTED / CANCELLED',
                role: 'RECEPTIONIST / MANAGER',
              },
              {
                status: 'OBJECTED (客户有异议)',
                color: '#ef4444',
                next: 'RE_VALUATED / COMPLETED / CANCELLED',
                role: 'PROCESSOR / MANAGER',
              },
              {
                status: 'RE_VALUATED (重新估价完成)',
                color: '#06b6d4',
                next: 'PENDING_CONFIRMATION / CANCELLED',
                role: 'RECEPTIONIST / MANAGER',
              },
              {
                status: 'CONFIRMED (客户已确认)',
                color: '#10b981',
                next: 'COMPLETED / CANCELLED',
                role: 'RECEPTIONIST / MANAGER',
              },
              {
                status: 'REJECTED (已拒绝)',
                color: '#6b7280',
                next: '（终态）',
                role: '-',
              },
              {
                status: 'COMPLETED (回收完成)',
                color: '#059669',
                next: '（终态）',
                role: '-',
              },
              {
                status: 'CANCELLED (已取消)',
                color: '#6b7280',
                next: '（终态）',
                role: '-',
              },
            ].map((item, i) => (
              <div key={i} style={styles.statusCard}>
                <div style={styles.statusCardHeader}>
                  <span style={{ ...styles.statusDot, background: item.color }} />
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
                  {item.note && (
                    <div>
                      <span style={styles.statusLabel}>说明：</span>
                      <span style={styles.statusValue}>{item.note}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h3 style={styles.subTitle}>2.2 估价状态机（ValuationStatus）</h3>
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
                next: 'SUBMITTED（重新提交）',
                role: 'PROCESSOR',
              },
            ].map((item, i) => (
              <div key={i} style={styles.statusCard}>
                <div style={styles.statusCardHeader}>
                  <span style={{ ...styles.statusDot, background: item.color }} />
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
                  {item.note && (
                    <div>
                      <span style={styles.statusLabel}>说明：</span>
                      <span style={styles.statusValue}>{item.note}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h3 style={styles.subTitle}>2.3 确认状态机（ConfirmationStatus）</h3>
          <div style={styles.statusGrid}>
            {[
              {
                status: 'PENDING (待确认)',
                color: '#f59e0b',
                next: 'CONFIRMED / OBJECTED / EXPIRED',
                role: 'RECEPTIONIST / MANAGER',
                note: '含expiredAt，GET时惰性检查过期',
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
                next: '（终态，禁止confirm/object/mark_seen）',
                role: '-',
                note: '需发起新的客户确认，历史可连续回看',
              },
            ].map((item, i) => (
              <div key={i} style={styles.statusCard}>
                <div style={styles.statusCardHeader}>
                  <span style={{ ...styles.statusDot, background: item.color }} />
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
                  {item.note && (
                    <div>
                      <span style={styles.statusLabel}>说明：</span>
                      <span style={styles.statusValue}>{item.note}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

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
                  <span>幂等键记录在 <code>IdempotentRecord</code> 中（字段：<code>key</code>, <code>action</code>, <code>orderId</code>, <code>response</code>），包含完整响应内容</span>
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
                  <span>审计日志字段：<code>action</code>、<code>actorRole</code>、<code>actorId</code>、<code>actorName</code>、<code>oldValue</code>、<code>newValue</code>、<code>field</code>、<code>idempotencyKey</code></span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>审计日志仅 <code>PROCESSOR</code> 和 <code>MANAGER</code> 角色可查看</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>API：<code>GET /api/orders/[id]/audit</code>，店长订单详情页"审计日志"Tab可直接查看</span>
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
                  <span><code>CustomerConfirmation.valuationId</code> 关联到具体估价版本，选择不同确认记录时回看对应估价</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span><code>CustomerConfirmation.seenValuationRemarks</code> 追踪客户在该次确认中已查看的备注ID</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>发起确认时 <code>seenValuationRemarks</code> 初始为空，不默认客户已查看备注</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>只有 <code>isVisibleToCustomer = true</code> 的备注会展示给客户，未查看备注需前台手动标记</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>确认历史按时间倒序展示，每条显示关联估价版本、备注查看比例、异议摘要</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span><code>expiredAt</code> 字段管理确认时效：默认24小时有效期，GET时惰性检查自动流转为 EXPIRED</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>EXPIRED 状态的确认记录禁止执行 confirm/object/mark_seen 操作，需重新发起</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>过期记录与新记录同时保留在历史列表，可连续切换回看</span>
                </div>
                <div style={styles.checkItem}>
                  <span style={styles.checkMark}>✓</span>
                  <span>校验点：发起确认 → 标记备注已查看 → 确认，回看时能看到对应估价和已查看标记</span>
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

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>四、角色入口说明</h2>
          <div style={styles.roleGrid}>
            <div style={styles.roleCard}>
              <div style={styles.roleIcon}>👩‍💼</div>
              <h3 style={styles.roleName}>前台</h3>
              <div style={styles.roleCode}>RECEPTIONIST</div>
              <div style={styles.roleDesc}>
                负责接待客户、创建回收单、发起客户确认、标记备注已查看、记录客户异议、完成回收
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
                  <li>📢 发起客户确认（备注初始未查看）</li>
                  <li>👁️ 标记客户已查看备注</li>
                  <li>✅ 客户确认接受价格</li>
                  <li>❌ 记录客户异议</li>
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
                  <li>📜 查看审计日志（API）</li>
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
                  <li>订单详情：<code>/manager/order/[id]</code>（含估价历史、确认历史、审计日志三个Tab）</li>
                </ul>
              </div>
              <div style={styles.roleActions}>
                <strong>常用动作：</strong>
                <ul>
                  <li>✅ 审批通过估价（可附审批备注）</li>
                  <li>❌ 审批拒绝估价（必填拒绝原因）</li>
                  <li>📊 查看回收总额统计</li>
                  <li>📜 查看审计日志（订单详情"审计日志"Tab）</li>
                  <li>⚠️ 处理异常订单</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

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
                  customer: '张先生',
                  device: 'Apple iPhone 14 Pro 256GB 深空黑',
                  status: 'PENDING_VALUATION',
                  urgency: 'URGENT',
                  price: null,
                  desc: '待估价，屏幕有轻微划痕、电池健康度85%，标签"老客户/高价值"，紧急订单',
                },
                {
                  no: '订单2',
                  customer: '王女士',
                  device: 'MacBook Pro 14寸 M2 512GB 银色',
                  status: 'PENDING_CONFIRMATION',
                  urgency: 'NORMAL',
                  price: '¥9,500',
                  desc: '估价9500元已审批通过。共2条确认记录：① EXPIRED（线上，created 2天前，expired 昨天，客户未查看备注）；② PENDING（现场，created 10分钟前，expired 5分钟后 ⏱️ 倒计时演示）。1条客户可见备注："客户说因为换新款所以出，机器爱护得很好，底部磕碰是放包里钥匙蹭的，功能全好。" 另有2条内部备注（处理人员利润分析、店长提醒数据备份）',
                },
                {
                  no: '订单3',
                  customer: '刘先生',
                  device: '华为 Mate 60 Pro 512GB 雅川青',
                  status: 'OBJECTED',
                  urgency: 'EMERGENCY',
                  price: '¥2,800',
                  desc: '⭐ 特急！客户情绪激动，异议："我这手机才买半年，买的时候6999，怎么才给2800？屏幕只是小裂痕，不影响使用啊！你们是不是故意压价？" 已有1条可见备注，客户已查看该备注',
                },
                {
                  no: '订单4',
                  customer: '陈先生',
                  device: 'Apple iPad Pro 11寸 256GB 深空灰',
                  status: 'CONFIRMED',
                  urgency: 'NORMAL',
                  price: '¥4,800',
                  desc: '客户已确认4800元（含Apple Pencil），转介绍客户，完美品相',
                },
                {
                  no: '订单5',
                  customer: '孙女士',
                  device: 'Sony A7M4 黑色',
                  status: 'COMPLETED',
                  urgency: 'NORMAL',
                  price: '¥9,500',
                  desc: '已完成的历史订单，9500元回收，线上渠道，相机品类',
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
                          item.status === 'OBJECTED'
                            ? '#fef2f2'
                            : item.status === 'PENDING_VALUATION'
                            ? '#fef3c7'
                            : item.status === 'PENDING_CONFIRMATION'
                            ? '#ede9fe'
                            : item.status === 'CONFIRMED'
                            ? '#f0fdf4'
                            : '#f0fdf4',
                        color:
                          item.status === 'OBJECTED'
                            ? '#dc2626'
                            : item.status === 'PENDING_VALUATION'
                            ? '#92400e'
                            : item.status === 'PENDING_CONFIRMATION'
                            ? '#6d28d9'
                            : '#059669',
                      }}
                    >
                      {item.status}
                    </span>
                    {item.urgency !== 'NORMAL' && (
                      <span style={styles.seedUrgency}>
                        {item.urgency === 'EMERGENCY' ? '🔴 特急' : '🟡 紧急'}
                      </span>
                    )}
                  </div>
                  <div style={styles.seedCustomer}>
                    {item.customer} {item.price && `· 估价 ${item.price}`}
                  </div>
                  <div style={styles.seedDesc}>{item.desc}</div>
                </div>
              ))}
            </div>

            <h4 style={styles.subTitle}>5.2 数据存储说明</h4>
            <div style={styles.dataNote}>
              <p>• 使用内存 <code>Map</code> 存储，服务重启数据会重置</p>
              <p>• <code>Database</code> 类在构造时自动调用 <code>initializeSeedData()</code> 初始化种子数据</p>
              <p>• 幂等键存储在 <code>idempotentRecords</code> Map 中，键为幂等键字符串</p>
              <p>• 订单编号格式：<code>RC</code> + 日期8位 + 计数器4位，如 <code>RC2026061510001</code></p>
              <p>• 种子数据还包含6条审计日志（均关联订单3），模拟完整的异议场景操作历史</p>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>六、暂未实现的集成点</h2>
          <div style={styles.todoList}>
            {[
              {
                priority: '高',
                title: '新建回收单页面',
                path: '/pages/*/create.tsx',
                desc: '前台创建新回收单的表单，包含设备信息录入、拍照上传',
              },
              {
                priority: '中',
                title: '审计日志独立筛选页',
                path: '/pages/audit/[id].tsx',
                desc: '当前审计日志在店长订单详情页Tab中查看，暂不支持按操作人、操作类型筛选',
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
                desc: '电子签名功能，客户确认时签名留存（CustomerConfirmation.signature 字段已预留）',
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
                desc: '当前使用模拟用户上下文（X-Role/X-User-Id/X-User-Name请求头），生产环境需要真实登录',
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
                        item.priority === '高' ? '#fef2f2' : item.priority === '中' ? '#fef3c7' : '#f3f4f6',
                      color:
                        item.priority === '高' ? '#dc2626' : item.priority === '中' ? '#92400e' : '#4b5563',
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

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>七、快速测试路径</h2>
          <div style={styles.testPath}>
            <h4 style={styles.subTitle}>路径1：正常确认流程（订单2 - MacBook Pro 14寸 M2）</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>前台</strong> 登录 → 工作台中找到王女士的MacBook订单（状态 PENDING_CONFIRMATION）</li>
                <li>点击进入客户确认详情 → 确认历史中已有1条 PENDING 状态的线上确认记录，自动被选中</li>
                <li>看到关联估价v1（9500元）和1条客户可见备注，备注标记为"客户未查看"（seenValuationRemarks为空）</li>
                <li>点击"👁️ 客户已查看全部备注" → 备注状态变为"客户已查看"，右侧确认按钮解锁</li>
                <li>点击"客户确认接受价格" → 状态变为 CONFIRMED</li>
                <li>点击"完成回收" → 状态变为 COMPLETED</li>
              </ol>
              <p style={styles.testNote}>
                💡 此路径验证：<strong>seenValuationRemarks 初始为空</strong>、<strong>客户确认时校验所有可见备注已查看</strong>、
                <strong>备注查看状态持久化</strong> 三个责任追踪特性
              </p>
            </div>

            <h4 style={styles.subTitle}>路径2：异议-重估流程（订单3 ⭐ 华为Mate 60 Pro - 推荐）</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>前台</strong> 登录 → 工作台找到刘先生的华为Mate 60 Pro（红色特急标签）</li>
                <li>进入客户确认详情 → 看到异议告警："我这手机才买半年，买的时候6999，怎么才给2800？"</li>
                <li>点击确认历史记录 → 回看该次确认关联的估价v1（2800元）和备注查看状态</li>
                <li>切换到 <strong>处理人员</strong> 登录 → 估价工作台找到该订单（有异议提醒）</li>
                <li>进入估价详情 → 查看之前的估价版本和内部备注（"修好后可以卖4200左右"）</li>
                <li>点击"重新估价" → 调整价格（比如从2800调到3500）</li>
                <li>添加一条客户可见备注："根据客户反馈重新评估，调整回收价格至3500元"</li>
                <li>提交审批 → 切换到 <strong>店长</strong> 登录</li>
                <li>店长工作台找到该订单 → 进入订单详情 → "估价历史"Tab选择v2 → "审批操作"区点击"审批通过"</li>
                <li>切换回 <strong>前台</strong> → 订单状态变为 RE_VALUATED</li>
                <li>发起客户确认 → 备注初始为"未查看"，先点击"客户已查看全部备注"</li>
                <li>客户确认接受 → 完成回收</li>
              </ol>
              <p style={styles.testNote}>
                💡 此路径可验证：<strong>备注流转</strong>（可见/不可见）、<strong>估价版本</strong>（v1→v2）、<strong>异议处理</strong>、
                <strong>状态机约束</strong>（OBJECTED→RE_VALUATED→PENDING_CONFIRMATION）、<strong>角色权限</strong>（三个角色各司其职）、
                <strong>备注查看追踪</strong>（初始为空、手动标记）六个核心特性
              </p>
            </div>

            <h4 style={styles.subTitle}>路径3：店长审计日志查看（订单3）</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>店长</strong> 登录 → 进入订单3详情</li>
                <li>切换到"审计日志"Tab → 可看到6条种子审计日志</li>
                <li>验证字段：操作人（王师傅/刘店长/赵前台）、角色、新旧值对比、幂等键</li>
                <li>执行一次审批操作 → 刷新审计日志 → 确认新增记录</li>
              </ol>
            </div>

            <h4 style={styles.subTitle}>路径4：幂等性验证</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>在浏览器开发者工具中开启"网络"面板</li>
                <li>执行任意写操作（如修改状态），记录请求体和 <code>X-Idempotency-Key</code> 头</li>
                <li>使用 curl 或 Postman 重复发送相同请求（相同幂等键）</li>
                <li>第二次请求应返回相同响应，但不产生新的审计日志</li>
              </ol>
            </div>

            <h4 style={styles.subTitle}>路径5：客户确认历史回看（订单4 - iPad Pro 11寸）</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>前台</strong> 登录 → 进入订单4客户确认详情</li>
                <li>确认历史中有一条已确认记录 → 点击选中</li>
                <li>看到关联估价v1（4800元）和备注查看状态（"客户已查看"标记）</li>
                <li>异议详情区域为空（该确认无异议）</li>
              </ol>
              <p style={styles.testNote}>
                💡 此路径验证确认记录与估价的关联回看，<code>valuationId</code> 是回看的关键字段
              </p>
            </div>

            <h4 style={styles.subTitle}>路径6：过期-重发确认测试（订单2 - MacBook Pro 14寸 M2 ⭐ 推荐）</h4>
            <div style={styles.testSteps}>
              <ol>
                <li>以 <strong>前台</strong> 登录 → 进入订单2客户确认详情</li>
                <li>页面顶部倒计时显示："⏱️ 有效期：X分Y秒后过期"（当前5分钟后过期，紧急状态红色）</li>
                <li>确认历史列表中有两条记录：① 已过期（灰色，显示"到期：昨天XX:XX"）；② 待确认（橙色，倒计时）</li>
                <li>点击已过期记录 → 页面顶部显示灰色过期告警："确认记录已过期，请点击右侧重新发起"；估价和备注区域关联到v1（9500元），但操作按钮全部消失</li>
                <li>确认历史列表中可来回切换两条记录，实现过期记录与活跃记录的 <strong>连续回看</strong></li>
                <li>切换回PENDING记录 → 点击"👁️ 客户已查看全部备注"（验证未过期时可以操作）</li>
                <li>等待5分钟（或修改测试数据将expiredAt设为过去时间） → 刷新页面 → PENDING记录自动变为EXPIRED（惰性检查）</li>
                <li>此时所有操作按钮消失，右侧出现"🔄 重新发起客户确认"按钮，可选择确认方式后发起新确认</li>
                <li>新确认创建后 → 确认历史变为3条（2条EXPIRED + 1条PENDING），可连续切换回看</li>
              </ol>
              <p style={styles.testNote}>
                💡 此路径验证：<strong>expiredAt倒计时</strong>、<strong>惰性过期检查</strong>、<strong>EXPIRED状态禁止操作</strong>、
                <strong>连续回看（过期+新记录共存）</strong>、<strong>重新发起确认入口</strong> 五个核心时效管理特性
              </p>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1100px', margin: '0 auto', paddingBottom: '60px' },
  pageTitle: { fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '32px', textAlign: 'center' as const },
  section: { marginBottom: '40px', background: 'white', borderRadius: '12px', padding: '28px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #e5e7eb' },
  sectionTitle: { fontSize: '20px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 20px 0', paddingBottom: '12px', borderBottom: '2px solid #e5e7eb' },
  subTitle: { fontSize: '16px', fontWeight: 'bold', color: '#374151', margin: '24px 0 12px 0' },
  codeBlock: { background: '#1f2937', color: '#e5e7eb', padding: '20px', borderRadius: '10px', fontSize: '12px', lineHeight: '1.6', overflowX: 'auto' as const, fontFamily: 'Menlo, Monaco, monospace' },
  statusGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px', marginBottom: '16px' },
  statusCard: { background: '#f9fafb', borderRadius: '8px', padding: '14px', border: '1px solid #e5e7eb' },
  statusCardHeader: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' },
  statusDot: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0 },
  statusName: { fontSize: '14px', fontWeight: 'bold', color: '#1f2937' },
  statusInfo: { display: 'flex', flexDirection: 'column' as const, gap: '4px' },
  statusLabel: { fontSize: '11px', color: '#6b7280', marginRight: '4px' },
  statusValue: { fontSize: '12px', color: '#374151', fontWeight: '500' },
  checkList: { display: 'flex', flexDirection: 'column' as const, gap: '20px' },
  checkSection: { background: '#f9fafb', borderRadius: '10px', padding: '18px', border: '1px solid #e5e7eb' },
  checkTitle: { fontSize: '15px', fontWeight: 'bold', color: '#1f2937', margin: '0 0 12px 0' },
  checkItemWrap: { display: 'flex', flexDirection: 'column' as const, gap: '8px' },
  checkItem: { display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', color: '#374151', lineHeight: '1.6' },
  checkMark: { color: '#059669', fontWeight: 'bold', flexShrink: 0, marginTop: '1px' },
  roleGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' },
  roleCard: { background: '#f9fafb', borderRadius: '12px', padding: '20px', border: '1px solid #e5e7eb' },
  roleIcon: { fontSize: '36px', textAlign: 'center' as const, marginBottom: '8px' },
  roleName: { fontSize: '18px', fontWeight: 'bold', color: '#1f2937', textAlign: 'center' as const, margin: '0 0 4px 0' },
  roleCode: { textAlign: 'center' as const, fontSize: '12px', color: '#6b7280', fontFamily: 'monospace', marginBottom: '12px' },
  roleDesc: { fontSize: '13px', color: '#4b5563', lineHeight: '1.6', marginBottom: '12px' },
  roleEntry: { fontSize: '13px', color: '#374151', marginBottom: '12px' },
  roleEntryLabel: { color: '#6b7280' },
  roleLink: { background: '#eff6ff', color: '#2563eb', padding: '2px 6px', borderRadius: '4px', fontFamily: 'monospace' },
  rolePages: { marginBottom: '12px', fontSize: '13px', color: '#374151' },
  roleActions: { fontSize: '13px', color: '#374151' },
  dataSection: { fontSize: '14px', color: '#374151', lineHeight: '1.7' },
  dataLocation: { marginBottom: '16px', fontSize: '14px' },
  dataCode: { background: '#f3f4f6', padding: '3px 8px', borderRadius: '4px', fontFamily: 'monospace', marginLeft: '8px' },
  seedList: { display: 'flex', flexDirection: 'column' as const, gap: '10px', marginBottom: '20px' },
  seedItem: { background: '#f9fafb', borderRadius: '8px', padding: '14px', border: '1px solid #e5e7eb' },
  seedHeader: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' as const },
  seedNo: { fontWeight: 'bold', color: '#1f2937', fontSize: '14px' },
  seedDevice: { color: '#374151', fontSize: '14px' },
  seedStatus: { padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', fontFamily: 'monospace' },
  seedUrgency: { padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '500' },
  seedCustomer: { fontSize: '13px', color: '#374151', marginBottom: '4px' },
  seedDesc: { fontSize: '13px', color: '#6b7280', lineHeight: '1.5' },
  dataNote: { background: '#fffbeb', borderRadius: '8px', padding: '14px 18px', border: '1px solid #fcd34d' },
  todoList: { display: 'flex', flexDirection: 'column' as const, gap: '10px' },
  todoItem: { background: '#f9fafb', borderRadius: '8px', padding: '14px', border: '1px solid #e5e7eb' },
  todoLeft: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' },
  todoPriority: { padding: '2px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
  todoTitle: { fontSize: '14px', fontWeight: 'bold', color: '#1f2937' },
  todoPath: { marginBottom: '4px' },
  todoDesc: { fontSize: '13px', color: '#6b7280', lineHeight: '1.6' },
  testPath: { fontSize: '14px', color: '#374151', lineHeight: '1.7' },
  testSteps: { background: '#f9fafb', borderRadius: '8px', padding: '16px 20px', marginBottom: '16px' },
  testNote: { marginTop: '10px', padding: '10px 14px', background: '#f0fdf4', borderRadius: '6px', color: '#166534', fontSize: '13px' },
};

export default Docs;
