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
  else alert('返修单详情（集成点：待开发返修模块）')
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
</style>
