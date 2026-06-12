<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Role, AccountingTask } from '~/types'
import { RoleMeta } from '~/types'
import StatusTag from '~/components/StatusTag.vue'

const props = defineProps<{
  visible: boolean
  task: AccountingTask | null
  role: Role
}>()

const emit = defineEmits<{
  close: []
  action: [action: string, task: AccountingTask]
}>()

const activeTab = ref<'timeline' | 'bills' | 'vouchers' | 'issues'>('timeline')

const actionMeta = computed(() => {
  const map: Record<string, { label: string; color: string; icon: string }> = {
    submit: { label: '提交', color: 'var(--color-info)', icon: '↑' },
    pass: { label: '复核通过', color: 'var(--color-success)', icon: '✓' },
    reject: { label: '驳回', color: 'var(--color-danger)', icon: '✕' },
    rework: { label: '开始修正', color: 'var(--color-warning)', icon: '↻' },
    complete: { label: '完成归档', color: 'var(--color-success)', icon: '★' }
  }
  return map
})

const totalBillCount = computed(() => props.task?.bills.reduce((s, b) => s + b.count, 0) || 0)
const totalBillAmount = computed(() => props.task?.bills.reduce((s, b) => s + b.amount, 0) || 0)

const issueList = computed(() => {
  if (!props.task) return []
  return props.task.reviewRecords.flatMap(r => (r.issues || []).map(i => ({ ...i, reviewAt: r.at, reviewer: r.reviewer })))
})

const actionButtons = computed(() => {
  if (!props.task) return []
  const s = props.task.status
  const r = props.role
  const btns: { key: string; label: string; tone: 'primary' | 'success' | 'danger' | 'warning' | 'ghost' }[] = []
  if (r === 'accountant') {
    if (s === 'pending_accounting') btns.push({ key: 'start_accounting', label: '开始账务处理', tone: 'primary' })
    if (s === 'accounting') btns.push({ key: 'submit_review', label: '提交凭证复核', tone: 'primary' })
    if (s === 'review_reject') {
      btns.push({ key: 'fix_done', label: '修正完成重新提交', tone: 'primary' })
      btns.push({ key: 'ask_manager', label: '联系客户经理沟通', tone: 'warning' })
    }
  }
  if (r === 'manager') {
    if (s === 'pending_bill') btns.push({ key: 'remind_bill', label: '再次催交票据', tone: 'warning' })
    btns.push({ key: 'contact_client', label: '联系客户', tone: 'ghost' })
  }
  if (r === 'supervisor') {
    if (s === 'pending_review' || s === 'reviewing') {
      btns.push({ key: 'pass', label: '复核通过', tone: 'success' })
      btns.push({ key: 'reject', label: '驳回修正', tone: 'danger' })
    }
    if (s === 'review_pass') btns.push({ key: 'complete', label: '完成归档', tone: 'success' })
  }
  return btns
})
</script>

<template>
  <Teleport to="body">
    <Transition name="drawer">
      <div v-if="visible && task" class="drawer-mask" @click.self="emit('close')">
        <div class="drawer-panel">
          <header class="drawer-header">
            <div class="header-main">
              <div class="title-row">
                <h2 class="title">{{ task.customer.name }}</h2>
                <StatusTag :status="task.status" />
                <span v-if="task.overdue" class="overdue-pill">已逾期</span>
              </div>
              <div class="sub-row">
                <span class="period">{{ task.period }} 账期</span>
                <span class="sep">·</span>
                <span>{{ task.customer.industry }} / {{ task.customer.scale }}</span>
                <span class="sep">·</span>
                <span>税号：{{ task.customer.taxNo }}</span>
              </div>
            </div>
            <button class="close-btn" @click="emit('close')">×</button>
          </header>

          <section v-if="task.hasRisk && task.riskNote" class="risk-banner">
            <span class="risk-icon">!</span>
            <div class="risk-text">
              <strong>风险提醒：</strong>{{ task.riskNote }}
            </div>
          </section>

          <section class="summary-grid">
            <div class="summary-item">
              <span class="label">客户经理</span>
              <span class="value">{{ task.customer.accountManager }}</span>
            </div>
            <div class="summary-item">
              <span class="label">记账会计</span>
              <span class="value">{{ task.customer.accountant }}</span>
            </div>
            <div class="summary-item">
              <span class="label">复核主管</span>
              <span class="value">{{ task.customer.reviewer }}</span>
            </div>
            <div class="summary-item">
              <span class="label">截止日期</span>
              <span class="value" :class="{ 'text-danger': task.overdue }">{{ task.deadline }}</span>
            </div>
            <div class="summary-item">
              <span class="label">票据总数</span>
              <span class="value">{{ totalBillCount }} 张</span>
            </div>
            <div class="summary-item">
              <span class="label">凭证数</span>
              <span class="value">{{ task.vouchers.length }} 张</span>
            </div>
          </section>

          <nav class="tab-nav">
            <button
              v-for="t in [
                { k: 'timeline', l: '责任链路', b: task.reviewRecords.length },
                { k: 'bills', l: '票据归集', b: task.bills.length },
                { k: 'vouchers', l: '凭证明细', b: task.vouchers.length },
                { k: 'issues', l: '问题记录', b: issueList.length }
              ]"
              :key="t.k"
              class="tab"
              :class="{ active: activeTab === t.k }"
              @click="activeTab = t.k as any"
            >
              {{ t.l }}
              <span v-if="t.b > 0" class="tab-badge" :class="{ danger: t.k === 'issues' && t.b > 0 }">{{ t.b }}</span>
            </button>
          </nav>

          <section class="tab-content">
            <template v-if="activeTab === 'timeline'">
              <div class="timeline">
                <div
                  v-for="(record, idx) in [...task.reviewRecords].reverse()"
                  :key="record.id"
                  class="timeline-item"
                >
                  <div class="timeline-marker">
                    <div
                      class="marker-dot"
                      :style="{ backgroundColor: actionMeta[record.action].color, borderColor: actionMeta[record.action].color }"
                    >
                      {{ actionMeta[record.action].icon }}
                    </div>
                    <div v-if="idx < task.reviewRecords.length - 1" class="marker-line" />
                  </div>
                  <div class="timeline-body">
                    <div class="timeline-head">
                      <span
                        class="action-label"
                        :style="{ backgroundColor: actionMeta[record.action].color + '22', color: actionMeta[record.action].color }"
                      >
                        {{ actionMeta[record.action].label }}
                      </span>
                      <span class="person">{{ record.reviewer }}</span>
                      <span class="role-tag">{{ RoleMeta[record.role].label }}</span>
                      <span class="time">{{ record.at }}</span>
                    </div>
                    <div class="timeline-comment">{{ record.comment }}</div>
                    <div v-if="record.issues && record.issues.length > 0" class="issue-blocks">
                      <div
                        v-for="iss in record.issues"
                        :key="iss.field + iss.description"
                        class="issue-block"
                        :class="iss.severity"
                      >
                        <span class="severity-label">
                          {{ iss.severity === 'error' ? '错误' : iss.severity === 'warning' ? '警告' : '建议' }}
                        </span>
                        <span class="issue-field">{{ iss.field }}</span>
                        <span class="issue-desc">{{ iss.description }}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="timeline-item current">
                  <div class="timeline-marker">
                    <div class="marker-dot current-dot">●</div>
                  </div>
                  <div class="timeline-body">
                    <div class="timeline-head">
                      <span class="action-label current">当前状态</span>
                      <StatusTag :status="task.status" size="sm" />
                    </div>
                    <div class="timeline-comment">当前由 <strong>{{ task.currentHandler }}</strong> 负责处理。</div>
                  </div>
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'bills'">
              <div class="bill-summary">
                <div class="bill-stat">
                  <span class="stat-label">票据类别</span>
                  <span class="stat-value">{{ task.bills.length }} 类</span>
                </div>
                <div class="bill-stat">
                  <span class="stat-label">总张数</span>
                  <span class="stat-value">{{ totalBillCount }} 张</span>
                </div>
                <div class="bill-stat">
                  <span class="stat-label">累计金额</span>
                  <span class="stat-value amount">¥ {{ totalBillAmount.toLocaleString() }}</span>
                </div>
              </div>
              <div class="bill-list">
                <div v-for="b in task.bills" :key="b.id" class="bill-item">
                  <div class="bill-main">
                    <div class="bill-type-row">
                      <span class="bill-type">{{ b.type }}</span>
                      <span class="bill-count">{{ b.count }} 张</span>
                    </div>
                    <div class="bill-meta">
                      上传者：{{ b.uploader }} · {{ b.uploadedAt }}
                    </div>
                    <div v-if="b.note" class="bill-note">📝 {{ b.note }}</div>
                  </div>
                  <div class="bill-amount" v-if="b.amount > 0">
                    ¥ {{ b.amount.toLocaleString() }}
                  </div>
                </div>
                <div v-if="task.bills.length === 0" class="empty-hint">
                  暂无上传票据，请先联系客户经理催收
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'vouchers'">
              <div v-if="task.vouchers.length === 0" class="empty-hint large">
                <div class="emoji">📋</div>
                <div class="hint-title">凭证尚未录入</div>
                <div class="hint-sub">完成票据归集后，记账会计将开始凭证录入</div>
              </div>
              <div v-else class="voucher-list">
                <div v-for="v in task.vouchers.slice(0, 5)" :key="v.id" class="voucher-item">
                  <div class="voucher-head">
                    <div class="voucher-no">
                      <span class="prefix">凭证号</span>
                      <strong>{{ v.voucherNo }}</strong>
                    </div>
                    <span class="voucher-date">{{ v.date }}</span>
                    <span
                      class="voucher-status"
                      :class="v.status"
                    >
                      {{ v.status === 'reviewed' ? '已复核' : v.status === 'submitted' ? '待复核' : '草稿' }}
                    </span>
                  </div>
                  <div class="voucher-entries">
                    <div v-for="e in v.entries.slice(0, 2)" :key="e.id" class="entry-row">
                      <span class="entry-summary">{{ e.summary }}</span>
                      <span class="entry-debit">借：{{ e.debitAccount }} ¥{{ e.debitAmount.toLocaleString() }}</span>
                      <span class="entry-credit">贷：{{ e.creditAccount }} ¥{{ e.creditAmount.toLocaleString() }}</span>
                    </div>
                    <div v-if="v.entries.length > 2" class="entry-more">
                      还有 {{ v.entries.length - 2 }} 条分录...
                    </div>
                  </div>
                  <div class="voucher-foot">
                    <span>制单人：{{ v.createdBy }} · {{ v.createdAt }}</span>
                    <span>附件：{{ v.attachedBillIds.length }} 张票据</span>
                  </div>
                </div>
                <div v-if="task.vouchers.length > 5" class="more-vouchers">
                  还有 {{ task.vouchers.length - 5 }} 张凭证，点击查看全部 →
                </div>
              </div>
            </template>

            <template v-else-if="activeTab === 'issues'">
              <div v-if="issueList.length === 0" class="empty-hint large">
                <div class="emoji">✅</div>
                <div class="hint-title">暂无问题记录</div>
                <div class="hint-sub">该任务目前没有被驳回或标记的问题项</div>
              </div>
              <div v-else class="issue-list">
                <div
                  v-for="(iss, i) in issueList"
                  :key="i"
                  class="issue-card"
                  :class="iss.severity"
                >
                  <div class="issue-card-head">
                    <span class="sev-tag" :class="iss.severity">
                      {{ iss.severity === 'error' ? '错误' : iss.severity === 'warning' ? '警告' : '建议' }}
                    </span>
                    <span class="iss-field">{{ iss.field }}</span>
                    <span class="iss-meta">{{ iss.reviewer }} · {{ iss.reviewAt }}</span>
                  </div>
                  <div class="issue-card-body">{{ iss.description }}</div>
                </div>
              </div>
            </template>
          </section>

          <footer class="drawer-footer">
            <div class="foot-hint">
              <template v-if="role === 'accountant'">当前身份：<strong>记账会计</strong> · 对凭证数据的准确性负责</template>
              <template v-else-if="role === 'manager'">当前身份：<strong>客户经理</strong> · 对客户票据完整性和沟通负责</template>
              <template v-else>当前身份：<strong>财务主管</strong> · 对凭证复核和风险把控负责</template>
            </div>
            <div class="foot-actions">
              <button class="foot-btn ghost" @click="emit('close')">关闭</button>
              <button
                v-for="btn in actionButtons"
                :key="btn.key"
                class="foot-btn"
                :class="btn.tone"
                @click="emit('action', btn.key, task)"
              >
                {{ btn.label }}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.drawer-mask {
  position: fixed;
  inset: 0;
  background-color: rgba(15, 23, 42, 0.45);
  backdrop-filter: blur(2px);
  z-index: 999;
  display: flex;
  justify-content: flex-end;
}
.drawer-panel {
  width: 760px;
  max-width: 92vw;
  height: 100vh;
  background-color: var(--color-bg-card);
  display: flex;
  flex-direction: column;
  box-shadow: -12px 0 40px rgba(0, 0, 0, 0.12);
}

.drawer-enter-active,
.drawer-leave-active {
  transition: all 0.3s ease;
}
.drawer-enter-from,
.drawer-leave-to {
  opacity: 0;
}
.drawer-enter-from .drawer-panel,
.drawer-leave-to .drawer-panel {
  transform: translateX(100%);
}

.drawer-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 22px 26px 18px;
  border-bottom: 1px solid var(--color-border);
}
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.title {
  font-size: 19px;
  font-weight: 700;
  color: var(--color-text);
}
.overdue-pill {
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}
.sub-row {
  font-size: 12px;
  color: var(--color-text-muted);
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}
.sep { color: var(--color-border-strong); }
.close-btn {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: var(--color-text-secondary);
  transition: all 0.15s ease;
}
.close-btn:hover {
  background-color: var(--color-bg-soft);
  color: var(--color-text);
}

.risk-banner {
  display: flex;
  gap: 10px;
  padding: 12px 20px;
  margin: 14px 26px 0;
  background-color: var(--color-warning-light);
  border-left: 3px solid var(--color-warning);
  border-radius: 8px;
  font-size: 13px;
}
.risk-icon {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background-color: var(--color-warning);
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}
.risk-text {
  color: #78350f;
  line-height: 1.5;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 18px 26px 0;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 14px;
  background-color: var(--color-bg-soft);
  border-radius: 8px;
}
.summary-item .label {
  font-size: 11px;
  color: var(--color-text-muted);
}
.summary-item .value {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
}
.summary-item .text-danger {
  color: var(--color-danger);
}

.tab-nav {
  display: flex;
  padding: 0 26px;
  border-bottom: 1px solid var(--color-border);
  margin-top: 20px;
  gap: 4px;
}
.tab {
  position: relative;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
}
.tab:hover {
  color: var(--color-text);
}
.tab.active {
  color: var(--color-primary);
}
.tab.active::after {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  bottom: -1px;
  height: 2px;
  background-color: var(--color-primary);
  border-radius: 2px;
}
.tab-badge {
  min-width: 20px;
  padding: 1px 6px;
  font-size: 11px;
  font-weight: 600;
  background-color: var(--color-bg-soft);
  color: var(--color-text-secondary);
  border-radius: 10px;
  text-align: center;
}
.tab-badge.danger {
  background-color: var(--color-danger-light);
  color: var(--color-danger);
}

.tab-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 26px 20px;
}

/* Timeline */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.timeline-item {
  display: flex;
  gap: 14px;
}
.timeline-marker {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 28px;
  flex-shrink: 0;
}
.marker-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background-color: var(--color-bg-card);
  border: 2px solid;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #fff;
  flex-shrink: 0;
  z-index: 1;
}
.current-dot {
  background-color: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
  font-size: 8px;
  box-shadow: 0 0 0 4px var(--color-primary-light);
}
.marker-line {
  flex: 1;
  width: 2px;
  background-color: var(--color-border);
  margin: 4px 0;
  min-height: 20px;
}
.timeline-body {
  flex: 1;
  background-color: var(--color-bg-soft);
  border-radius: 10px;
  padding: 14px 16px;
  margin-bottom: 14px;
}
.timeline-item.current .timeline-body {
  background-color: var(--color-primary-light);
  border: 1px dashed var(--color-primary);
}
.timeline-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.action-label {
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 999px;
}
.action-label.current {
  background-color: var(--color-primary) !important;
  color: #fff !important;
}
.person {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text);
}
.role-tag {
  font-size: 11px;
  padding: 1px 6px;
  background-color: var(--color-bg-card);
  color: var(--color-text-secondary);
  border-radius: 4px;
}
.time {
  font-size: 12px;
  color: var(--color-text-muted);
  margin-left: auto;
}
.timeline-comment {
  font-size: 13px;
  color: var(--color-text);
  line-height: 1.6;
}
.issue-blocks {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-top: 10px;
}
.issue-block {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: var(--color-bg-card);
  border-radius: 6px;
  border-left: 3px solid;
  font-size: 12px;
}
.issue-block.error { border-left-color: var(--color-danger); }
.issue-block.warning { border-left-color: var(--color-warning); }
.issue-block.suggestion { border-left-color: var(--color-info); }
.severity-label {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 7px;
  border-radius: 4px;
}
.issue-block.error .severity-label { background-color: var(--color-danger-light); color: var(--color-danger); }
.issue-block.warning .severity-label { background-color: var(--color-warning-light); color: var(--color-warning); }
.issue-block.suggestion .severity-label { background-color: var(--color-info-light); color: var(--color-info); }
.issue-field {
  font-weight: 600;
  color: var(--color-text);
}
.issue-desc {
  color: var(--color-text-secondary);
  flex: 1;
  min-width: 200px;
}

/* Bills */
.bill-summary {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 18px;
}
.bill-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 14px;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
  border-radius: 10px;
}
.stat-label { font-size: 12px; color: var(--color-text-secondary); }
.stat-value { font-size: 18px; font-weight: 700; color: var(--color-text); }
.stat-value.amount { color: var(--color-primary); }

.bill-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.bill-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 14px 16px;
  background-color: var(--color-bg-soft);
  border-radius: 10px;
  gap: 12px;
}
.bill-type-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 4px;
}
.bill-type { font-size: 14px; font-weight: 600; color: var(--color-text); }
.bill-count {
  font-size: 11px;
  padding: 2px 8px;
  background-color: var(--color-bg-card);
  color: var(--color-text-secondary);
  border-radius: 999px;
}
.bill-meta { font-size: 12px; color: var(--color-text-muted); margin-bottom: 4px; }
.bill-note { font-size: 12px; color: var(--color-text-secondary); }
.bill-amount {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary);
  white-space: nowrap;
}
.empty-hint {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted);
  background-color: var(--color-bg-soft);
  border-radius: 10px;
}
.empty-hint.large {
  padding: 50px 24px;
}
.empty-hint .emoji {
  font-size: 40px;
  margin-bottom: 12px;
}
.empty-hint .hint-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 6px;
}
.empty-hint .hint-sub {
  font-size: 12px;
  color: var(--color-text-muted);
}

/* Vouchers */
.voucher-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.voucher-item {
  background-color: var(--color-bg-soft);
  border-radius: 10px;
  overflow: hidden;
}
.voucher-head {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background-color: #e0f2fe;
  border-bottom: 1px solid var(--color-border);
}
.voucher-no .prefix {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-right: 6px;
}
.voucher-no strong {
  font-size: 14px;
  color: var(--color-text);
}
.voucher-date { font-size: 12px; color: var(--color-text-secondary); }
.voucher-status {
  margin-left: auto;
  padding: 2px 10px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 999px;
}
.voucher-status.reviewed { background-color: var(--color-success-light); color: var(--color-success); }
.voucher-status.submitted { background-color: var(--color-warning-light); color: var(--color-warning); }
.voucher-status.draft { background-color: var(--color-bg-soft); color: var(--color-text-muted); }

.voucher-entries {
  padding: 12px 16px;
}
.entry-row {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr;
  gap: 10px;
  padding: 6px 0;
  font-size: 12px;
  border-bottom: 1px dashed var(--color-border);
}
.entry-row:last-child { border-bottom: none; }
.entry-summary { color: var(--color-text); font-weight: 500; }
.entry-debit { color: var(--color-danger); }
.entry-credit { color: var(--color-success); }
.entry-more {
  padding: 8px 0 0;
  font-size: 12px;
  color: var(--color-primary);
  cursor: pointer;
}

.voucher-foot {
  display: flex;
  justify-content: space-between;
  padding: 10px 16px;
  font-size: 11px;
  color: var(--color-text-muted);
  background-color: var(--color-bg-soft);
  border-top: 1px solid var(--color-border);
}
.more-vouchers {
  padding: 12px;
  text-align: center;
  font-size: 13px;
  color: var(--color-primary);
  background-color: var(--color-primary-light);
  border-radius: 10px;
  cursor: pointer;
  font-weight: 500;
}

/* Issue list */
.issue-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.issue-card {
  padding: 14px 16px;
  border-radius: 10px;
  border-left: 4px solid;
  background-color: var(--color-bg-soft);
}
.issue-card.error { border-left-color: var(--color-danger); background-color: var(--color-danger-light); }
.issue-card.warning { border-left-color: var(--color-warning); background-color: var(--color-warning-light); }
.issue-card.suggestion { border-left-color: var(--color-info); background-color: var(--color-info-light); }
.issue-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
.sev-tag {
  padding: 2px 8px;
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
}
.issue-card.error .sev-tag { background-color: var(--color-danger); color: #fff; }
.issue-card.warning .sev-tag { background-color: var(--color-warning); color: #fff; }
.issue-card.suggestion .sev-tag { background-color: var(--color-info); color: #fff; }
.iss-field { font-size: 13px; font-weight: 600; color: var(--color-text); }
.iss-meta { margin-left: auto; font-size: 11px; color: var(--color-text-muted); }
.issue-card-body {
  font-size: 13px;
  color: var(--color-text-secondary);
  line-height: 1.6;
}

.drawer-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 26px;
  border-top: 1px solid var(--color-border);
  background-color: var(--color-bg-soft);
  gap: 14px;
  flex-wrap: wrap;
}
.foot-hint {
  font-size: 12px;
  color: var(--color-text-secondary);
}
.foot-hint strong { color: var(--color-text); }
.foot-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}
.foot-btn {
  padding: 9px 18px;
  font-size: 13px;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.15s ease;
}
.foot-btn.ghost {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-border);
  color: var(--color-text-secondary);
}
.foot-btn.ghost:hover { border-color: var(--color-border-strong); color: var(--color-text); }
.foot-btn.primary { background-color: var(--color-primary); color: #fff; }
.foot-btn.primary:hover { background-color: var(--color-primary-hover); }
.foot-btn.success { background-color: var(--color-success); color: #fff; }
.foot-btn.success:hover { background-color: #15803d; }
.foot-btn.danger { background-color: var(--color-danger); color: #fff; }
.foot-btn.danger:hover { background-color: #b91c1c; }
.foot-btn.warning {
  background-color: var(--color-bg-card);
  border: 1px solid var(--color-warning);
  color: var(--color-warning);
}
.foot-btn.warning:hover { background-color: var(--color-warning-light); }
</style>
