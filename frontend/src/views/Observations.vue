<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'

const router = useRouter()
const route = useRoute()
const observations = ref([])
const loading = ref(true)
const error = ref('')
const filters = ref({ status: '', alertOnly: '' })

const statusLabels = {
  waiting: '等待留观',
  observing: '留观中',
  completed: '正常关闭',
  abnormal: '异常关闭',
}

const statusColors = {
  waiting: '#909399',
  observing: '#409eff',
  completed: '#67c23a',
  abnormal: '#f56c6c',
}

const appointmentStatusLabels = {
  pending: '待确认',
  confirmed: '已确认',
  inoculating: '接种中',
  inoculated: '已接种',
  observing: '留观中',
  completed: '已完成',
  cancelled: '已取消',
}

const auth = computed(() => JSON.parse(localStorage.getItem('auth') || 'null'))

async function loadObservations() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (filters.value.status) params.set('status', filters.value.status)
    if (filters.value.alertOnly) params.set('alertOnly', filters.value.alertOnly)
    const qs = params.toString()
    const res = await api.getObservations(qs ? `?${qs}` : '')
    observations.value = res.data
  } catch (e) {
    error.value = e?.error?.message || '加载失败'
  } finally {
    loading.value = false
    await nextTick()
    applyHighlight()
  }
}

onMounted(loadObservations)

function resetFilters() {
  filters.value = { status: '', alertOnly: '' }
  loadObservations()
}

const actionLoading = ref({})
const actionError = ref('')

async function startObs(id) {
  actionLoading.value[id] = true
  actionError.value = ''
  try {
    await api.startObservation(id, '开始留观观察')
    loadObservations()
  } catch (e) {
    actionError.value = e?.error?.message || '操作失败'
  } finally {
    actionLoading.value[id] = false
  }
}

const showCompleteDialog = ref(null)
const completeNote = ref('')
const markAbnormal = ref(false)

async function completeObs(id) {
  actionLoading.value[id] = true
  actionError.value = ''
  try {
    await api.completeObservation(id, completeNote.value, markAbnormal.value)
    showCompleteDialog.value = null
    completeNote.value = ''
    markAbnormal.value = false
    loadObservations()
  } catch (e) {
    actionError.value = e?.error?.message || '操作失败'
  } finally {
    actionLoading.value[id] = false
  }
}

const showHandoverDialog = ref(null)
const handoverTo = ref('')
const handoverReason = ref('')

async function doHandover(id) {
  actionLoading.value[id] = true
  actionError.value = ''
  try {
    await api.handoverObservation(id, handoverTo.value, handoverReason.value)
    showHandoverDialog.value = null
    handoverTo.value = ''
    handoverReason.value = ''
    loadObservations()
  } catch (e) {
    actionError.value = e?.error?.message || '操作失败'
  } finally {
    actionLoading.value[id] = false
  }
}

function canStart(o) {
  return o.status === 'waiting' && (auth.value?.role === '护士' || auth.value?.role === '公共卫生专员')
}

function canComplete(o) {
  return o.status === 'observing' && (auth.value?.role === '护士' || auth.value?.role === '公共卫生专员')
}

function canHandover(o) {
  return (o.status === 'waiting' || o.status === 'observing') && (auth.value?.role === '护士' || auth.value?.role === '公共卫生专员')
}

function isStuck(o) {
  return (o.status === 'waiting' || o.status === 'observing') && o.elapsedMinutes > 30
}

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}

function getResponsibilityChain(o) {
  const chain = [{ person: o.nurseName, role: '接种护士（初始负责人）' }]
  if (o.handovers?.length) {
    for (const h of o.handovers) {
      chain.push({ person: h.to, role: `接手人（${h.reason || '交接'}）`, from: h.from, time: h.time })
    }
  }
  return chain
}

const expandedId = ref(null)
function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function goToAppointments(appointmentId) {
  router.push({ path: '/appointments', query: appointmentId ? { highlight: appointmentId } : {} })
}

const nurseOptions = ['周小燕', '吴丽萍']

const highlightId = ref(null)

async function applyHighlight() {
  const hid = route.query.highlight
  if (!hid) return
  highlightId.value = hid
  if (observations.value.find((o) => o.id === hid)) {
    expandedId.value = hid
    await nextTick()
    const el = document.getElementById('obs-' + hid)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('highlight-flash')
      setTimeout(() => el.classList.remove('highlight-flash'), 2500)
    }
  }
}

watch(() => route.query.highlight, () => { if (!loading.value) applyHighlight() })
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h3>留观记录</h3>
    </div>

    <div class="filter-bar">
      <select v-model="filters.status" @change="loadObservations">
        <option value="">全部状态</option>
        <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
      </select>
      <select v-model="filters.alertOnly" @change="loadObservations">
        <option value="">全部</option>
        <option value="true">仅告警</option>
      </select>
      <button class="btn btn-primary" @click="loadObservations">查询</button>
      <button class="btn btn-default" @click="resetFilters">重置</button>
    </div>

    <div v-if="actionError" class="action-error">{{ actionError }}</div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <div class="obs-list">
        <div
          v-for="o in observations"
          :key="o.id"
          :id="'obs-' + o.id"
          class="obs-card"
          :class="{
            'card-alert': o.alertTriggered,
            'card-stuck': isStuck(o),
            'card-abnormal': o.status === 'abnormal',
            'card-completed': o.status === 'completed',
            'card-highlight': highlightId === o.id,
          }"
        >
          <div class="obs-head">
            <span class="obs-id">{{ o.id }}</span>
            <span class="obs-name">{{ o.residentName }}</span>
            <span class="obs-vaccine">{{ o.vaccineName }}</span>
            <span
              class="status-tag"
              :style="{ background: statusColors[o.status] + '1a', color: statusColors[o.status] }"
            >
              {{ statusLabels[o.status] }}
            </span>
            <span v-if="o.alertTriggered" class="alert-badge">⚠ 告警</span>
            <span v-if="isStuck(o)" class="stuck-badge">🔴 超时 {{ o.elapsedMinutes }}分钟</span>
          </div>

          <div class="obs-meta">
            <span>当前负责人: <strong>{{ o.responsiblePerson }}</strong></span>
            <span v-if="o.startedAt">开始: {{ formatTime(o.startedAt) }}</span>
            <span v-if="o.completedAt">完成: {{ formatTime(o.completedAt) }}</span>
            <span v-if="o.durationMinutes">时长: {{ o.durationMinutes }}分钟</span>
            <span v-if="o.elapsedMinutes && !o.completedAt">已过: {{ o.elapsedMinutes }}分钟</span>
          </div>

          <div v-if="o.alertReason" class="alert-reason">⚠ {{ o.alertReason }}</div>

          <div v-if="o.status === 'waiting'" class="gap-indicator">
            <div class="gap-title">⏳ 等待开始留观 — 避免责任空档</div>
            <div class="gap-body">
              接种已完成（接种护士：<strong>{{ o.nurseName }}</strong>），留观初始负责人为 <strong>{{ o.responsiblePerson }}</strong>。
              请立即点击「开始留观」，确保接种后30分钟观察不出现无人负责的空档。
            </div>
          </div>

          <div v-if="o.appointmentId" class="appointment-link" @click="goToAppointments(o.appointmentId)">
            📎 关联预约: {{ o.appointmentId }}
            <span v-if="o.appointmentStatus" class="appt-status">
              （预约状态: {{ appointmentStatusLabels[o.appointmentStatus] || o.appointmentStatus }}）
            </span>
            <span v-if="o.appointmentDoctor" class="appt-doctor">· 签约医生: {{ o.appointmentDoctor }}</span>
          </div>

          <div class="obs-actions">
            <button v-if="canStart(o)" class="btn-action start" :disabled="actionLoading[o.id]" @click="startObs(o.id)">开始留观</button>
            <button v-if="canComplete(o)" class="btn-action complete" :disabled="actionLoading[o.id]" @click="showCompleteDialog = o.id; completeNote = ''; markAbnormal = false">完成留观</button>
            <button v-if="canHandover(o)" class="btn-action handover" :disabled="actionLoading[o.id]" @click="showHandoverDialog = o.id; handoverTo = ''; handoverReason = ''">交接</button>
            <button class="btn-link" @click="toggleDetail(o.id)">{{ expandedId === o.id ? '收起' : '查看记录' }}</button>
          </div>

          <div v-if="expandedId === o.id" class="obs-detail">
            <h5>责任链</h5>
            <div class="responsibility-chain">
              <div v-for="(node, i) in getResponsibilityChain(o)" :key="i" class="chain-node">
                <span class="chain-person">{{ node.person }}</span>
                <span class="chain-role">{{ node.role }}</span>
                <span v-if="node.from" class="chain-from">（{{ node.from }} 交接 · {{ formatTime(node.time) }}）</span>
                <span v-if="i < getResponsibilityChain(o).length - 1" class="chain-arrow">→</span>
              </div>
            </div>

            <h5>观察记录</h5>
            <div class="obs-timeline" v-if="o.observations?.length">
              <div v-for="(item, i) in o.observations" :key="i" class="timeline-item">
                <span class="timeline-time">{{ formatTime(item.time) }}</span>
                <span class="timeline-note">{{ item.note }}</span>
              </div>
            </div>
            <div v-else class="empty-tip">暂无观察记录</div>

            <h5 v-if="o.handovers?.length">交接记录</h5>
            <div v-if="o.handovers?.length" class="handover-list">
              <div v-for="(h, i) in o.handovers" :key="i" class="handover-item">
                <span class="handover-from">{{ h.from }}</span>
                <span class="handover-arrow">→</span>
                <span class="handover-to">{{ h.to }}</span>
                <span class="handover-time">{{ formatTime(h.time) }}</span>
                <span v-if="h.reason" class="handover-reason">（{{ h.reason }}）</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showCompleteDialog" class="dialog-overlay">
        <div class="dialog">
          <h4>完成留观</h4>
          <div class="form-item">
            <label>备注</label>
            <textarea v-model="completeNote" rows="3" placeholder="留观结束情况说明"></textarea>
          </div>
          <div class="form-item">
            <label class="checkbox-label">
              <input type="checkbox" v-model="markAbnormal" />
              标记为异常关闭（出现不良反应等）
            </label>
          </div>
          <div class="dialog-actions">
            <button class="btn btn-primary" @click="completeObs(showCompleteDialog)" :disabled="actionLoading[showCompleteDialog]">确认</button>
            <button class="btn btn-default" @click="showCompleteDialog = null">取消</button>
          </div>
        </div>
      </div>

      <div v-if="showHandoverDialog" class="dialog-overlay">
        <div class="dialog">
          <h4>留观责任交接</h4>
          <div class="form-item">
            <label>交接给 *</label>
            <select v-model="handoverTo">
              <option value="">请选择</option>
              <option v-for="n in nurseOptions" :key="n" :value="n">{{ n }}</option>
            </select>
          </div>
          <div class="form-item">
            <label>交接原因</label>
            <input v-model="handoverReason" placeholder="如：下班交接" />
          </div>
          <div class="dialog-actions">
            <button class="btn btn-primary" @click="doHandover(showHandoverDialog)" :disabled="actionLoading[showHandoverDialog] || !handoverTo">确认交接</button>
            <button class="btn btn-default" @click="showHandoverDialog = null">取消</button>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 1100px; }
.page-header { margin-bottom: 16px; }
.page-header h3 { margin: 0; font-size: 18px; color: #303133; }

.filter-bar {
  display: flex;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-bar select, .filter-bar input {
  padding: 6px 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.btn { padding: 6px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; }
.btn-primary { background: #409eff; color: #fff; }
.btn-primary:hover { background: #66b1ff; }
.btn-default { background: #fff; border: 1px solid #dcdfe6; color: #606266; }
.btn-default:hover { color: #409eff; border-color: #409eff; }

.action-error { background: #fef0f0; color: #f56c6c; padding: 8px 12px; border-radius: 4px; margin-bottom: 12px; font-size: 13px; }
.loading, .error { text-align: center; padding: 40px; color: #909399; }
.error { color: #f56c6c; }

.obs-list { display: flex; flex-direction: column; gap: 12px; }

.obs-card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  border-left: 4px solid #409eff;
}

.obs-card.card-alert { border-left-color: #e6a23c; }
.obs-card.card-stuck { border-left-color: #f56c6c; background: #fff5f5; }
.obs-card.card-abnormal { border-left-color: #f56c6c; }
.obs-card.card-completed { border-left-color: #67c23a; opacity: 0.85; }

.obs-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.obs-id { font-weight: 600; color: #303133; font-size: 13px; }
.obs-name { font-weight: 600; color: #303133; }
.obs-vaccine { font-size: 13px; color: #909399; }

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.alert-badge {
  background: #fdf6ec;
  color: #e6a23c;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.stuck-badge {
  background: #fef0f0;
  color: #f56c6c;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.obs-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #606266;
  flex-wrap: wrap;
}

.obs-meta strong { color: #303133; }

.alert-reason {
  margin-top: 8px;
  padding: 8px 12px;
  background: #fdf6ec;
  border-radius: 4px;
  font-size: 13px;
  color: #8a6d3b;
}

.gap-indicator {
  margin-top: 8px;
  padding: 12px;
  background: #ecf5ff;
  border-left: 3px solid #409eff;
  border-radius: 4px;
}

.gap-title {
  font-size: 13px;
  font-weight: 600;
  color: #409eff;
  margin-bottom: 4px;
}

.gap-body {
  font-size: 13px;
  color: #409eff;
  line-height: 1.6;
}

.appointment-link {
  margin-top: 8px;
  font-size: 13px;
  color: #409eff;
  cursor: pointer;
}

.appointment-link:hover { text-decoration: underline; }

.appt-status { color: #909399; font-size: 12px; }

.obs-actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.btn-action {
  padding: 4px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.btn-action.start { background: #ecf5ff; color: #409eff; }
.btn-action.complete { background: #f0f9eb; color: #67c23a; }
.btn-action.handover { background: #fdf6ec; color: #e6a23c; }
.btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-link { background: none; border: none; color: #409eff; cursor: pointer; font-size: 13px; }
.btn-link:hover { text-decoration: underline; }

.obs-detail {
  margin-top: 12px;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}

.obs-detail h5 {
  margin: 12px 0 8px;
  font-size: 14px;
  color: #303133;
}

.obs-detail h5:first-child { margin-top: 0; }

.responsibility-chain {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 10px 12px;
  background: #f5f7fa;
  border-radius: 6px;
  margin-bottom: 4px;
}

.chain-node {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
}

.chain-person {
  font-weight: 600;
  color: #303133;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.chain-role {
  font-size: 12px;
  color: #909399;
}

.chain-from {
  font-size: 11px;
  color: #c0c4cc;
}

.chain-arrow {
  color: #409eff;
  font-weight: 700;
  font-size: 14px;
}

.obs-timeline {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.timeline-item {
  display: flex;
  gap: 12px;
  font-size: 13px;
}

.timeline-time {
  color: #909399;
  white-space: nowrap;
  min-width: 140px;
}

.timeline-note { color: #303133; }

.empty-tip { font-size: 13px; color: #c0c4cc; }

.handover-list { display: flex; flex-direction: column; gap: 6px; }

.handover-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 4px;
}

.handover-from { font-weight: 600; color: #303133; }
.handover-arrow { color: #409eff; }
.handover-to { font-weight: 600; color: #409eff; }
.handover-time { color: #909399; margin-left: auto; }
.handover-reason { color: #606266; }

.dialog-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.dialog {
  background: #fff;
  border-radius: 8px;
  padding: 24px;
  width: 440px;
}

.dialog h4 { margin: 0 0 16px; }

.form-item { margin-bottom: 12px; }
.form-item label { display: block; font-size: 12px; color: #909399; margin-bottom: 4px; }
.form-item input, .form-item select, .form-item textarea {
  width: 100%;
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  font-size: 13px !important;
  color: #303133 !important;
}

.checkbox-label input { width: auto; }

.dialog-actions { margin-top: 16px; display: flex; gap: 8px; justify-content: flex-end; }

.card-highlight {
  box-shadow: 0 0 0 2px #409eff, 0 2px 12px rgba(64,158,255,0.25);
}

.highlight-flash {
  animation: flash-border 0.6s ease 3;
}

@keyframes flash-border {
  0%, 100% { box-shadow: 0 0 0 2px #409eff, 0 2px 12px rgba(64,158,255,0.25); }
  50% { box-shadow: 0 0 0 4px #66b1ff, 0 2px 20px rgba(64,158,255,0.45); }
}

.appt-doctor { color: #909399; font-size: 12px; }
</style>
