<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">⚠️ 异常提醒</h1>
        <p class="page-subtitle">漏算价、批次问题、返修时效 - 集中处理所有异常</p>
      </div>
      <div class="flex gap-8">
        <select v-model="filterLevel" class="form-select-sm">
          <option value="all">全部级别</option>
          <option value="danger">🚨 紧急</option>
          <option value="warning">⚠️ 一般</option>
        </select>
        <select v-model="filterStatus" class="form-select-sm">
          <option value="all">全部状态</option>
          <option value="pending">待处理</option>
          <option value="processing">处理中</option>
          <option value="resolved">已解决</option>
          <option value="warning">持续关注</option>
        </select>
      </div>
    </div>

    <div class="grid-4 mb-16">
      <div class="stat-card" style="border-top:4px solid var(--danger)">
        <div class="stat-label">🚨 紧急异常</div>
        <div class="stat-value text-danger">{{ countByLevel('danger', true) }}</div>
      </div>
      <div class="stat-card" style="border-top:4px solid var(--warning)">
        <div class="stat-label">⚠️ 一般异常</div>
        <div class="stat-value text-warning">{{ countByLevel('warning', true) }}</div>
      </div>
      <div class="stat-card" style="border-top:4px solid var(--primary)">
        <div class="stat-label">⌛ 待处理</div>
        <div class="stat-value text-primary">{{ countByStatus('pending') }}</div>
      </div>
      <div class="stat-card" style="border-top:4px solid var(--success)">
        <div class="stat-label">✅ 已解决</div>
        <div class="stat-value text-success">{{ countByStatus('resolved') }}</div>
      </div>
    </div>

    <div class="space-y-12">
      <div v-for="an in filteredAnomalies" :key="an.id" 
           class="card anomaly-detail-card"
           :class="an.level === 'danger' ? 'level-danger' : 'level-warning'">
        <div class="card-body">
          <div class="flex gap-12 items-start">
            <div class="level-icon" :class="an.level">
              {{ an.level === 'danger' ? '🚨' : '⚠️' }}
            </div>
            <div class="flex-1">
              <div class="flex-between mb-8 flex-wrap">
                <div class="flex gap-8 items-center flex-wrap">
                  <span class="tag" :class="an.level === 'danger' ? 'tag-red' : 'tag-yellow'">
                    {{ an.level === 'danger' ? '紧急' : '一般' }}
                  </span>
                  <span class="tag tag-gray">{{ typeLabel(an.type) }}</span>
                  <h3 class="font-semibold text-lg">{{ an.title }}</h3>
                </div>
                <div class="flex gap-8 items-center">
                  <span v-if="an.deadline" class="deadline-tag" :class="{overdue: isOverdue(an.deadline)}">
                    ⏱️ {{ isOverdue(an.deadline) ? '已超时' : '截止' }}: {{ an.deadline }}
                  </span>
                  <span class="tag" :class="statusTagClass(an.status)">{{ statusLabel(an.status) }}</span>
                </div>
              </div>
              <p class="text-sm text-muted mb-12">{{ an.description }}</p>

              <div class="meta-row">
                <div class="meta-item">
                  <span class="meta-label">来源</span>
                  <span>{{ sourceLabel(an.source) }}</span>
                </div>
                <div class="meta-item">
                  <span class="meta-label">责任人</span>
                  <b>{{ an.responsible }}</b>
                </div>
                <div class="meta-item">
                  <span class="meta-label">创建时间</span>
                  <span>{{ an.createdAt }}</span>
                </div>
                <div class="meta-item" v-if="an.relatedId">
                  <span class="meta-label">关联</span>
                  <a @click="goRelated(an)" class="text-primary font-semibold">
                    {{ an.relatedType === 'schedule' ? '装机单' : an.relatedType === 'arrival' ? '到货单' : '返修单' }}: {{ an.relatedId }} →
                  </a>
                </div>
              </div>

              <div class="actions-row mt-12">
                <button class="btn btn-sm btn-outline" @click="goRelated(an)">查看关联详情</button>
                <button v-if="an.status === 'pending'" class="btn btn-sm btn-primary" @click="startProcessing(an.id)">开始处理</button>
                <button v-if="an.status === 'processing'" class="btn btn-sm btn-success" @click="markResolved(an.id)">标记解决</button>
                <button class="btn btn-sm btn-secondary" @click="noteHandler(an)">添加处理记录</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div v-if="filteredAnomalies.length === 0" class="card">
        <div class="empty">暂无符合条件的异常记录</div>
      </div>
    </div>

    <!-- 返修详情抽屉 -->
    <div v-if="showRepairDrawer" class="drawer-mask" @click.self="closeRepairDrawer">
      <div class="drawer-content">
        <div class="drawer-header">
          <div class="flex gap-8 items-center flex-wrap">
            <h3 class="font-semibold text-lg">🔧 返修详情</h3>
            <span v-if="currentRepair" class="tag" :class="statusTagClass(currentRepair.status)">
              {{ repairStatusLabel(currentRepair.status) }}
            </span>
          </div>
          <button class="close-btn" @click="closeRepairDrawer">×</button>
        </div>

        <div v-if="currentRepair" class="drawer-body">
          <!-- 基本信息 -->
          <div class="section">
            <div class="section-title">返修单号</div>
            <div class="repair-id-large">{{ currentRepair.id }}</div>
          </div>

          <div class="section">
            <div class="section-title">客户信息</div>
            <div class="info-grid-2">
              <div>
                <span class="info-label">客户姓名</span>
                <span class="info-value">{{ currentRepair.customerName }}</span>
              </div>
              <div>
                <span class="info-label">联系电话</span>
                <span class="info-value">{{ currentRepair.phone }}</span>
              </div>
              <div class="col-span-2">
                <span class="info-label">关联订单</span>
                <a v-if="currentRepair.orderId" @click="goToOrder(currentRepair.orderId)" class="info-value text-primary font-semibold">
                  {{ currentRepair.orderId }} →
                </a>
                <span v-else class="info-value text-muted">-</span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">问题描述</div>
            <div class="issue-box">
              {{ currentRepair.issue }}
            </div>
          </div>

          <!-- 关联批次 -->
          <div class="section">
            <div class="section-title">关联配件 / 批次</div>
            <div class="batch-info-card">
              <div class="flex-between mb-8">
                <span class="font-semibold">{{ currentRepair.mainPart }}</span>
                <span class="tag tag-cyan">{{ currentRepair.batchCode }}</span>
              </div>
              <div class="text-sm text-muted">
                该批次共 {{ sameBatchRepairs.length }} 起返修记录
                <button class="btn-link btn text-xs" @click="showBatchList = !showBatchList">
                  {{ showBatchList ? '收起' : '展开查看' }}
                </button>
              </div>
              <div v-if="showBatchList" class="batch-list mt-8">
                <div v-for="r in sameBatchRepairs" :key="r.id" class="batch-item">
                  <div class="flex-between">
                    <span class="text-sm font-semibold">{{ r.id }}</span>
                    <span class="tag" :class="r.status === 'resolved' ? 'tag-green' : 'tag-yellow'">
                      {{ repairStatusLabel(r.status) }}
                    </span>
                  </div>
                  <div class="text-xs text-muted mt-2">{{ r.issue }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- SLA 与处理进度 -->
          <div class="section">
            <div class="section-title">SLA 与处理进度</div>
            <div class="sla-card">
              <div class="sla-header">
                <span>SLA 时效: {{ currentRepair.slaHours }} 小时</span>
                <span :class="slaProgress > 100 ? 'text-danger font-semibold' : 'text-muted'">
                  已用 {{ currentRepair.actualHours }} 小时
                  ({{ Math.round(slaProgress) }}%)
                </span>
              </div>
              <div class="sla-bar">
                <div class="sla-progress"
                     :class="slaProgress > 100 ? 'bg-danger' : slaProgress > 80 ? 'bg-warning' : 'bg-success'"
                     :style="{width: Math.min(slaProgress, 100) + '%'}"></div>
              </div>
              <div class="sla-times">
                <div>
                  <span class="text-muted text-xs">上报时间</span>
                  <div class="text-sm">{{ currentRepair.reportedAt }}</div>
                </div>
                <div v-if="currentRepair.deadline" class="text-right">
                  <span class="text-muted text-xs">截止时间</span>
                  <div class="text-sm" :class="isOverdue(currentRepair.deadline) ? 'text-danger font-semibold' : ''">
                    {{ currentRepair.deadline }}
                    <span v-if="isOverdue(currentRepair.deadline)">（已超时）</span>
                  </div>
                </div>
                <div v-if="currentRepair.resolvedAt" class="text-right">
                  <span class="text-muted text-xs">解决时间</span>
                  <div class="text-sm text-success">{{ currentRepair.resolvedAt }}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- 责任认定 -->
          <div class="section">
            <div class="section-title">责任认定</div>
            <div v-if="currentRepair.responsible" class="responsibility-card">
              <div class="flex-between mb-8">
                <span class="font-semibold">{{ currentRepair.responsible.person }}</span>
                <span class="tag tag-yellow">{{ currentRepair.responsible.costBorne }}</span>
              </div>
              <div class="text-sm text-muted">{{ currentRepair.responsible.detail }}</div>
            </div>
            <div v-else class="empty-box text-muted text-sm">
              ⏳ 尚未完成责任认定
            </div>
          </div>

          <!-- 处理方案 -->
          <div class="section">
            <div class="section-title">处理方案</div>
            <div v-if="currentRepair.resolution" class="resolution-box">
              {{ currentRepair.resolution }}
            </div>
            <div v-else class="empty-box text-muted text-sm">
              🔄 处理中，待定解决方案
            </div>
          </div>

          <!-- 处理人 -->
          <div class="section">
            <div class="section-title">处理人</div>
            <div class="tech-info">
              <span class="tech-avatar">👨‍🔧</span>
              <div>
                <div class="font-semibold">{{ currentRepair.technician }}</div>
                <div class="text-xs text-muted">负责本次返修处理</div>
              </div>
            </div>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn btn-secondary" @click="closeRepairDrawer">关闭</button>
          <button v-if="currentRepair?.orderId" class="btn btn-primary" @click="goToOrder(currentRepair.orderId)">
            查看关联装机单 →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAppStore } from '@/store/app'

const router = useRouter()
const appStore = useAppStore()

const filterLevel = ref('all')
const filterStatus = ref('all')

const showRepairDrawer = ref(false)
const currentRepairId = ref('')
const showBatchList = ref(false)

const currentRepair = computed(() => appStore.repairs.find(r => r.id === currentRepairId.value))

const sameBatchRepairs = computed(() => {
  if (!currentRepair.value) return []
  return appStore.repairs.filter(r => r.batchCode === currentRepair.value.batchCode)
})

const slaProgress = computed(() => {
  if (!currentRepair.value) return 0
  return Math.round((currentRepair.value.actualHours / currentRepair.value.slaHours) * 100)
})

const filteredAnomalies = computed(() => {
  let list = [...appStore.anomalies]
  if (filterLevel.value !== 'all') list = list.filter(a => a.level === filterLevel.value)
  if (filterStatus.value !== 'all') list = list.filter(a => a.status === filterStatus.value)
  return list.sort((a, b) => {
    if (a.level !== b.level) return a.level === 'danger' ? -1 : 1
    const order = { pending: 0, processing: 1, warning: 2, resolved: 3 }
    return (order[a.status] ?? 5) - (order[b.status] ?? 5)
  })
})

function countByLevel(level, activeOnly = false) {
  return appStore.anomalies.filter(a => 
    a.level === level && (!activeOnly || a.status !== 'resolved')
  ).length
}
function countByStatus(status) {
  return appStore.anomalies.filter(a => a.status === status).length
}

function typeLabel(t) {
  return {
    price_change: '💰 价格异常',
    bsod_risk: '🔵 蓝屏风险',
    shortage: '📦 缺货短缺',
    sla_breach: '⏰ 时效超时',
    batch_warning: '🔍 批次预警',
    defective: '⚠️ 质量问题'
  }[t] || t
}
function sourceLabel(s) {
  return { system: '系统自动检测', warehouse: '仓管上报', service: '售后客服', manager: '店长', tech: '装机师' }[s] || s
}
function statusLabel(s) {
  return { pending: '待处理', processing: '处理中', resolved: '已解决', warning: '持续关注' }[s] || s
}
function statusTagClass(s) {
  return { pending: 'tag-red', processing: 'tag-yellow', resolved: 'tag-green', warning: 'tag-cyan' }[s] || 'tag-gray'
}

function isOverdue(d) {
  if (!d) return false
  return new Date(d.replace(/-/g, '/')).getTime() < Date.now()
}

function goRelated(an) {
  if (an.relatedType === 'schedule') router.push('/schedules/' + an.relatedId)
  else if (an.relatedType === 'arrival') router.push('/arrivals/' + an.relatedId)
  else if (an.relatedType === 'repair') openRepairDrawer(an.relatedId)
}

function repairStatusLabel(s) {
  return { pending: '待处理', processing: '处理中', resolved: '已解决' }[s] || s
}

function openRepairDrawer(repId) {
  currentRepairId.value = repId
  showBatchList.value = false
  showRepairDrawer.value = true
}
function closeRepairDrawer() {
  showRepairDrawer.value = false
}
function goToOrder(orderId) {
  if (!orderId) return
  if (orderId.startsWith('SO-')) {
    closeRepairDrawer()
    router.push('/schedules/' + orderId)
  }
}

function startProcessing(id) {
  appStore.updateAnomalyStatus(id, 'processing')
}
function markResolved(id) {
  appStore.updateAnomalyStatus(id, 'resolved')
}
function noteHandler(an) {
  const note = prompt('请输入处理记录:')
  if (note && an.relatedId) {
    appStore.addHistoryEntry(an.relatedType, an.relatedId, {
      time: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
      operator: '当前用户',
      action: '异常处理记录',
      detail: note
    })
    alert('已添加处理记录')
  }
}
</script>

<style scoped>
.mb-16 { margin-bottom: 16px; }
.mb-12 { margin-bottom: 12px; }
.mb-8 { margin-bottom: 8px; }
.mt-12 { margin-top: 12px; }
.gap-8 { gap: 8px; }
.gap-12 { gap: 12px; }
.space-y-12 > * + * { margin-top: 12px; }
.flex-wrap { flex-wrap: wrap; }

.form-select-sm { padding: 6px 10px; font-size: 13px; }

.anomaly-detail-card.level-danger {
  border-left: 4px solid var(--danger);
  background: linear-gradient(90deg, #fff5f5, white 50%);
}
.anomaly-detail-card.level-warning {
  border-left: 4px solid var(--warning);
  background: linear-gradient(90deg, #fffbeb, white 50%);
}

.level-icon {
  font-size: 28px;
  width: 48px;
  height: 48px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  flex-shrink: 0;
}
.level-icon.danger { background: var(--danger-light); }
.level-icon.warning { background: var(--warning-light); }

.deadline-tag {
  background: var(--warning-light);
  color: var(--warning);
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
}
.deadline-tag.overdue {
  background: var(--danger-light);
  color: var(--danger);
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px 32px;
  padding: 12px 0;
  border-top: 1px dashed var(--gray-200);
  border-bottom: 1px dashed var(--gray-200);
}
.meta-item {
  display: flex;
  gap: 6px;
  font-size: 13px;
}
.meta-label { color: var(--gray-500); flex-shrink: 0; }

.actions-row { display: flex; gap: 8px; flex-wrap: wrap; }

/* 抽屉 */
.drawer-mask {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.45);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
}
.drawer-content {
  width: 480px;
  max-width: 90vw;
  height: 100%;
  background: white;
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.3s ease;
}
@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
.drawer-header {
  padding: 16px 20px;
  border-bottom: 1px solid var(--gray-200);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
}
.drawer-footer {
  padding: 16px 20px;
  border-top: 1px solid var(--gray-200);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
.close-btn {
  width: 28px; height: 28px;
  border: none; background: var(--gray-100);
  border-radius: 6px; cursor: pointer;
  font-size: 18px; line-height: 1;
}
.close-btn:hover { background: var(--gray-200); }

/* 详情区块 */
.section {
  margin-bottom: 20px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--gray-500);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
}
.repair-id-large {
  font-size: 20px;
  font-weight: 700;
  color: var(--gray-800);
}
.info-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.col-span-2 { grid-column: span 2; }
.info-label {
  display: block;
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 2px;
}
.info-value {
  font-size: 14px;
  color: var(--gray-800);
}
.issue-box {
  padding: 12px 14px;
  background: var(--gray-50);
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--gray-700);
}

/* 批次卡 */
.batch-info-card {
  padding: 12px 14px;
  background: linear-gradient(135deg, #ecfeff, white);
  border: 1px solid #a5f3fc;
  border-radius: 8px;
}
.batch-list {
  padding-top: 8px;
  border-top: 1px dashed #a5f3fc;
}
.batch-item {
  padding: 8px 0;
  border-bottom: 1px dashed #e0e7ff;
}
.batch-item:last-child { border-bottom: none; }

/* SLA */
.sla-card {
  padding: 14px;
  background: var(--gray-50);
  border-radius: 8px;
}
.sla-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  margin-bottom: 8px;
}
.sla-bar {
  height: 8px;
  background: var(--gray-200);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}
.sla-progress {
  height: 100%;
  transition: width 0.3s;
}
.bg-success { background: var(--success) !important; }
.bg-warning { background: var(--warning) !important; }
.bg-danger { background: var(--danger) !important; }
.sla-times {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}
.text-right { text-align: right; }

/* 责任认定 */
.responsibility-card {
  padding: 12px 14px;
  background: linear-gradient(135deg, #fef3c7, #fffbeb);
  border: 1px solid #fcd34d;
  border-radius: 8px;
}
.empty-box {
  padding: 16px;
  text-align: center;
  background: var(--gray-50);
  border-radius: 8px;
}

/* 处理方案 */
.resolution-box {
  padding: 12px 14px;
  background: linear-gradient(135deg, #d1fae5, #ecfdf5);
  border: 1px solid #6ee7b7;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}

/* 处理人 */
.tech-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  background: var(--gray-50);
  border-radius: 8px;
}
.tech-avatar {
  font-size: 28px;
  width: 44px; height: 44px;
  background: var(--primary-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
