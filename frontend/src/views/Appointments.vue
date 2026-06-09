<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import api from '../api'

const router = useRouter()
const route = useRoute()
const appointments = ref([])
const loading = ref(true)
const error = ref('')
const filters = ref({ status: '', vaccineName: '', date: '' })

const statusLabels = {
  pending: '待确认',
  confirmed: '已确认',
  inoculating: '接种中',
  inoculated: '已接种',
  observing: '留观中',
  completed: '已完成',
  cancelled: '已取消',
}

const statusColors = {
  pending: '#e6a23c',
  confirmed: '#409eff',
  inoculating: '#409eff',
  inoculated: '#e6a23c',
  observing: '#e6a23c',
  completed: '#67c23a',
  cancelled: '#909399',
}

const obsStatusLabels = {
  waiting: '等待留观',
  observing: '留观中',
  completed: '正常关闭',
  abnormal: '异常关闭',
}

const obsStatusColors = {
  waiting: '#909399',
  observing: '#409eff',
  completed: '#67c23a',
  abnormal: '#f56c6c',
}

const auth = computed(() => JSON.parse(localStorage.getItem('auth') || 'null'))

const statusOrder = ['pending', 'confirmed', 'inoculating', 'inoculated', 'observing', 'completed', 'cancelled']

function getStatusStep(status) {
  return statusOrder.indexOf(status)
}

const showCreateForm = ref(false)
const newAppointment = ref({
  residentName: '',
  residentIdCard: '',
  residentPhone: '',
  vaccineName: '',
  vaccineBatch: '',
  appointmentDate: '',
  appointmentTime: '',
  doctorName: '',
})

const actionLoading = ref({})
const actionError = ref('')
const cancelReason = ref('')
const showCancelDialog = ref(null)

const lastCompletedObs = ref(null)

async function loadAppointments() {
  loading.value = true
  error.value = ''
  try {
    const params = new URLSearchParams()
    if (filters.value.status) params.set('status', filters.value.status)
    if (filters.value.vaccineName) params.set('vaccineName', filters.value.vaccineName)
    if (filters.value.date) params.set('date', filters.value.date)
    const qs = params.toString()
    const res = await api.getAppointments(qs ? `?${qs}` : '')
    appointments.value = res.data
  } catch (e) {
    error.value = e?.error?.message || '加载失败'
  } finally {
    loading.value = false
    await nextTick()
    applyHighlight()
  }
}

onMounted(loadAppointments)

function resetFilters() {
  filters.value = { status: '', vaccineName: '', date: '' }
  loadAppointments()
}

async function createAppointment() {
  try {
    await api.createAppointment(newAppointment.value)
    showCreateForm.value = false
    newAppointment.value = { residentName: '', residentIdCard: '', residentPhone: '', vaccineName: '', vaccineBatch: '', appointmentDate: '', appointmentTime: '', doctorName: '' }
    loadAppointments()
  } catch (e) {
    actionError.value = e?.error?.message || '创建失败'
  }
}

async function doAction(id, action) {
  actionLoading.value[id] = true
  actionError.value = ''
  lastCompletedObs.value = null
  try {
    if (action === 'confirm') {
      await api.updateAppointmentStatus(id, 'confirmed')
    } else if (action === 'cancel') {
      await api.updateAppointmentStatus(id, 'cancelled', cancelReason.value)
      showCancelDialog.value = null
      cancelReason.value = ''
    } else if (action === 'start-inoculation') {
      await api.startInoculation(id, auth.value?.name)
    } else if (action === 'complete-inoculation') {
      const res = await api.completeInoculation(id)
      if (res.data?.observation) {
        lastCompletedObs.value = res.data.observation
      }
    }
    loadAppointments()
  } catch (e) {
    actionError.value = e?.error?.message || '操作失败'
  } finally {
    actionLoading.value[id] = false
  }
}

function canConfirm(a) {
  return a.status === 'pending' && (auth.value?.role === '全科医生' || auth.value?.role === '公共卫生专员')
}

function canStartInoculation(a) {
  return a.status === 'confirmed' && (auth.value?.role === '护士' || auth.value?.role === '公共卫生专员')
}

function canCompleteInoculation(a) {
  return a.status === 'inoculating' && (auth.value?.role === '护士' || auth.value?.role === '公共卫生专员')
}

function canCancel(a) {
  return (a.status === 'pending' || a.status === 'confirmed') && auth.value?.role === '公共卫生专员'
}

function needsObservation(a) {
  return a.status === 'inoculated'
}

function goToObservations(observationId) {
  router.push({ path: '/observations', query: observationId ? { highlight: observationId } : {} })
}

const expandedId = ref(null)
function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}

const highlightId = ref(null)

async function applyHighlight() {
  const hid = route.query.highlight
  if (!hid) {
    highlightId.value = null
    expandedId.value = null
    return
  }
  let target = appointments.value.find((a) => a.id === hid)
  if (!target) {
    target = appointments.value.find((a) => a.observationId === hid)
  }
  if (!target) {
    highlightId.value = null
    expandedId.value = null
    return
  }
  highlightId.value = target.id
  expandedId.value = target.id
  await nextTick()
  const el = document.getElementById('apt-' + target.id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('highlight-flash')
    setTimeout(() => el.classList.remove('highlight-flash'), 2500)
  }
}

watch(() => route.query.highlight, () => { if (!loading.value) applyHighlight() })

function formatTime(t) {
  if (!t) return '-'
  return new Date(t).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="page">
    <div class="page-header">
      <h3>疫苗预约</h3>
      <button v-if="auth?.role === '公共卫生专员'" class="btn btn-primary" @click="showCreateForm = !showCreateForm">
        {{ showCreateForm ? '取消新建' : '+ 新建预约' }}
      </button>
    </div>

    <div v-if="lastCompletedObs" class="obs-created-banner">
      <div class="banner-content">
        <span class="banner-icon">✅</span>
        <span>接种完成，已自动创建留观记录 <strong>{{ lastCompletedObs.id }}</strong>，留观负责人：<strong>{{ lastCompletedObs.responsiblePerson }}</strong></span>
        <button class="btn btn-primary banner-btn" @click="goToObservations(lastCompletedObs?.id)">前往留观记录 →</button>
      </div>
    </div>

    <div v-if="showCreateForm" class="create-form">
      <h4>新建疫苗预约</h4>
      <div class="form-grid">
        <div class="form-item"><label>居民姓名 *</label><input v-model="newAppointment.residentName" /></div>
        <div class="form-item"><label>身份证号</label><input v-model="newAppointment.residentIdCard" /></div>
        <div class="form-item"><label>联系电话</label><input v-model="newAppointment.residentPhone" /></div>
        <div class="form-item"><label>疫苗名称 *</label><input v-model="newAppointment.vaccineName" /></div>
        <div class="form-item"><label>疫苗批号</label><input v-model="newAppointment.vaccineBatch" /></div>
        <div class="form-item"><label>预约日期 *</label><input v-model="newAppointment.appointmentDate" type="date" /></div>
        <div class="form-item"><label>预约时间 *</label><input v-model="newAppointment.appointmentTime" type="time" /></div>
        <div class="form-item"><label>签约医生</label><input v-model="newAppointment.doctorName" /></div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" @click="createAppointment">提交</button>
        <button class="btn btn-default" @click="showCreateForm = false">取消</button>
      </div>
    </div>

    <div class="filter-bar">
      <select v-model="filters.status" @change="loadAppointments">
        <option value="">全部状态</option>
        <option v-for="(label, key) in statusLabels" :key="key" :value="key">{{ label }}</option>
      </select>
      <input v-model="filters.vaccineName" placeholder="疫苗名称" @keyup.enter="loadAppointments" />
      <input v-model="filters.date" type="date" @change="loadAppointments" />
      <button class="btn btn-primary" @click="loadAppointments">查询</button>
      <button class="btn btn-default" @click="resetFilters">重置</button>
    </div>

    <div v-if="actionError" class="action-error">{{ actionError }}</div>

    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <template v-else>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>预约编号</th>
              <th>居民姓名</th>
              <th>疫苗名称</th>
              <th>预约日期</th>
              <th>医生</th>
              <th>状态</th>
              <th>留观状态</th>
              <th>留观负责人</th>
              <th>流程</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in appointments" :key="a.id" :id="'apt-' + a.id" :class="{ 'row-alert': needsObservation(a), 'row-highlight': highlightId === a.id }">
              <td>{{ a.id }}</td>
              <td>{{ a.residentName }}</td>
              <td>{{ a.vaccineName }}</td>
              <td>{{ a.appointmentDate }}</td>
              <td>{{ a.doctorName || '-' }}</td>
              <td>
                <span class="status-tag" :style="{ background: statusColors[a.status] + '1a', color: statusColors[a.status] }">
                  {{ statusLabels[a.status] }}
                </span>
              </td>
              <td>
                <span v-if="a.observationStatus" class="status-tag" :style="{ background: obsStatusColors[a.observationStatus] + '1a', color: obsStatusColors[a.observationStatus] }">
                  {{ obsStatusLabels[a.observationStatus] }}
                </span>
                <span v-else class="no-obs">-</span>
              </td>
              <td>
                <span v-if="a.observationResponsible" class="responsible-person">
                  {{ a.observationResponsible }}
                  <span v-if="a.observationHandoverCount" class="handover-count" title="已交接次数">🔄{{ a.observationHandoverCount }}</span>
                </span>
                <span v-else class="no-obs">-</span>
              </td>
              <td>
                <div class="step-bar">
                  <span
                    v-for="(s, i) in statusOrder.slice(0, 6)"
                    :key="s"
                    class="step-dot"
                    :class="{ active: getStatusStep(a.status) >= i, current: a.status === s }"
                    :title="statusLabels[s]"
                  ></span>
                </div>
              </td>
              <td class="action-cell">
                <button v-if="canConfirm(a)" class="btn-action confirm" :disabled="actionLoading[a.id]" @click="doAction(a.id, 'confirm')">确认</button>
                <button v-if="canStartInoculation(a)" class="btn-action start" :disabled="actionLoading[a.id]" @click="doAction(a.id, 'start-inoculation')">开始接种</button>
                <button v-if="canCompleteInoculation(a)" class="btn-action complete" :disabled="actionLoading[a.id]" @click="doAction(a.id, 'complete-inoculation')">完成接种</button>
                <button v-if="canCancel(a)" class="btn-action cancel" :disabled="actionLoading[a.id]" @click="showCancelDialog = a.id">取消</button>
                <button class="btn-link" @click="toggleDetail(a.id)">{{ expandedId === a.id ? '收起' : '详情' }}</button>
                <router-link v-if="needsObservation(a)" :to="{ path: '/observations', query: { highlight: a.observationId } }" class="obs-nav-link">→ 前往留观</router-link>
                <router-link v-else-if="a.observationId" :to="{ path: '/observations', query: { highlight: a.observationId } }" class="obs-view-link">查看留观</router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="showCancelDialog" class="dialog-overlay">
        <div class="dialog">
          <h4>取消预约</h4>
          <div class="form-item"><label>取消原因</label><input v-model="cancelReason" placeholder="请输入取消原因" /></div>
          <div class="dialog-actions">
            <button class="btn btn-primary" @click="doAction(showCancelDialog, 'cancel')">确认取消</button>
            <button class="btn btn-default" @click="showCancelDialog = null; cancelReason = ''">关闭</button>
          </div>
        </div>
      </div>

      <div v-for="a in appointments" :key="'d-'+a.id">
        <div v-if="expandedId === a.id" class="detail-panel">
          <h4>预约详情 - {{ a.id }}</h4>
          <div class="detail-grid">
            <div class="detail-item"><span class="label">居民姓名</span><span>{{ a.residentName }}</span></div>
            <div class="detail-item"><span class="label">身份证号</span><span class="mono">{{ a.residentIdCard }}</span></div>
            <div class="detail-item"><span class="label">联系电话</span><span>{{ a.residentPhone }}</span></div>
            <div class="detail-item"><span class="label">疫苗名称</span><span>{{ a.vaccineName }}</span></div>
            <div class="detail-item"><span class="label">疫苗批号</span><span>{{ a.vaccineBatch }}</span></div>
            <div class="detail-item"><span class="label">预约日期</span><span>{{ a.appointmentDate }}</span></div>
            <div class="detail-item"><span class="label">预约时间</span><span>{{ a.appointmentTime }}</span></div>
            <div class="detail-item"><span class="label">当前状态</span><span>{{ statusLabels[a.status] }}</span></div>
            <div class="detail-item"><span class="label">签约医生</span><span>{{ a.doctorName || '-' }}</span></div>
            <div class="detail-item"><span class="label">接种护士</span><span>{{ a.nurseName || '-' }}</span></div>
            <div class="detail-item"><span class="label">创建时间</span><span>{{ formatTime(a.createdAt) }}</span></div>
            <div class="detail-item"><span class="label">确认时间</span><span>{{ formatTime(a.confirmedAt) }}</span></div>
            <div class="detail-item"><span class="label">接种时间</span><span>{{ formatTime(a.inoculatedAt) }}</span></div>
            <div class="detail-item"><span class="label">留观完成</span><span>{{ formatTime(a.observationCompletedAt) }}</span></div>
            <div v-if="a.cancelReason" class="detail-item"><span class="label">取消原因</span><span class="danger">{{ a.cancelReason }}</span></div>
          </div>

          <div v-if="needsObservation(a)" class="gap-warning">
            <div class="gap-warning-title">⚠ 责任提示：接种已完成，留观尚未开始</div>
            <div class="gap-warning-body">
              居民 <strong>{{ a.residentName }}</strong> 已完成 {{ a.vaccineName }} 接种（护士：{{ a.nurseName }}），当前处于「已接种」状态，需立即进入30分钟留观观察。
              接种护士 <strong>{{ a.nurseName }}</strong> 为留观初始负责人。请前往「留观记录」开始留观，确保接种后观察不出现责任空档。
            </div>
            <router-link :to="{ path: '/observations', query: { highlight: a.observationId } }" class="gap-warning-link">立即前往留观记录 →</router-link>
          </div>

          <div v-else-if="a.observationId" class="obs-info-section">
            <div class="obs-info-title">📋 关联留观记录</div>
            <div class="obs-info-grid">
              <div class="obs-info-item">
                <span class="label">留观编号</span>
                <router-link :to="{ path: '/observations', query: { highlight: a.observationId } }" class="obs-info-link">{{ a.observationId }}</router-link>
              </div>
              <div class="obs-info-item">
                <span class="label">留观状态</span>
                <span class="status-tag" :style="{ background: obsStatusColors[a.observationStatus] + '1a', color: obsStatusColors[a.observationStatus] }">
                  {{ obsStatusLabels[a.observationStatus] }}
                </span>
              </div>
              <div class="obs-info-item">
                <span class="label">当前负责人</span>
                <strong>{{ a.observationResponsible }}</strong>
              </div>
              <div class="obs-info-item">
                <span class="label">交接次数</span>
                <span>{{ a.observationHandoverCount || 0 }}次</span>
              </div>
            </div>
            <div v-if="a.observationLastHandover" class="obs-handover-info">
              <span class="handover-label">最近交接:</span>
              <span class="handover-detail">{{ a.observationLastHandover.from }} → {{ a.observationLastHandover.to }}</span>
              <span class="handover-reason">（{{ a.observationLastHandover.reason }}）</span>
              <span class="handover-time">{{ formatTime(a.observationLastHandover.time) }}</span>
            </div>
            <div v-if="a.observationStatus === 'waiting'" class="gap-warning compact">
              <div class="gap-warning-body">
                ⚠ 留观尚未开始，当前负责人 <strong>{{ a.observationResponsible }}</strong> 需立即开始留观观察，避免责任空档。
              </div>
              <router-link :to="{ path: '/observations', query: { highlight: a.observationId } }" class="gap-warning-link">立即前往留观记录 →</router-link>
            </div>
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.page { max-width: 1200px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h3 { margin: 0; font-size: 18px; color: #303133; }

.obs-created-banner {
  background: #f0f9eb;
  border: 1px solid #c2e7b0;
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.banner-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.banner-icon { font-size: 16px; }
.banner-content span { font-size: 13px; color: #303133; }
.banner-btn { margin-left: auto; padding: 4px 12px; font-size: 12px; }

.create-form {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.create-form h4 { margin: 0 0 16px; font-size: 15px; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.form-item { display: flex; flex-direction: column; gap: 4px; }
.form-item label { font-size: 12px; color: #909399; }
.form-item input, .form-item select {
  padding: 6px 10px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  font-size: 13px;
  outline: none;
}

.form-actions { margin-top: 12px; display: flex; gap: 8px; }

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

.btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  text-decoration: none;
  display: inline-block;
}

.btn-primary { background: #409eff; color: #fff; }
.btn-primary:hover { background: #66b1ff; }
.btn-default { background: #fff; border: 1px solid #dcdfe6; color: #606266; }
.btn-default:hover { color: #409eff; border-color: #409eff; }

.action-error {
  background: #fef0f0;
  color: #f56c6c;
  padding: 8px 12px;
  border-radius: 4px;
  margin-bottom: 12px;
  font-size: 13px;
}

.loading, .error { text-align: center; padding: 40px; color: #909399; }
.error { color: #f56c6c; }

.table-wrap {
  background: #fff;
  border-radius: 8px;
  overflow-x: auto;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

table { width: 100%; border-collapse: collapse; font-size: 13px; }

th {
  background: #f5f7fa;
  padding: 10px 12px;
  text-align: left;
  font-weight: 600;
  color: #606266;
  white-space: nowrap;
}

td {
  padding: 10px 12px;
  border-top: 1px solid #ebeef5;
  color: #303133;
}

tr.row-alert { background: #fdf6ec; }

.mono { font-family: monospace; font-size: 12px; }

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.step-bar { display: flex; gap: 3px; }
.step-dot {
  width: 10px; height: 10px;
  border-radius: 50%;
  background: #e4e7ed;
}
.step-dot.active { background: #67c23a; }
.step-dot.current { background: #409eff; box-shadow: 0 0 4px #409eff; }

.action-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-action {
  padding: 3px 8px;
  border: none;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
}

.btn-action.confirm { background: #ecf5ff; color: #409eff; }
.btn-action.start { background: #f0f9eb; color: #67c23a; }
.btn-action.complete { background: #f0f9eb; color: #67c23a; }
.btn-action.cancel { background: #fef0f0; color: #f56c6c; }
.btn-action:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-link { background: none; border: none; color: #409eff; cursor: pointer; font-size: 13px; }
.btn-link:hover { text-decoration: underline; }

.obs-nav-link {
  font-size: 12px;
  color: #e6a23c;
  font-weight: 600;
  text-decoration: none;
  animation: blink 1.5s infinite;
}

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

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
  width: 400px;
}

.dialog h4 { margin: 0 0 16px; }

.dialog-actions {
  margin-top: 16px;
  display: flex;
  gap: 8px;
  justify-content: flex-end;
}

.detail-panel {
  margin-top: 16px;
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
}

.detail-panel h4 { margin: 0 0 16px; font-size: 15px; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 12px;
}

.detail-item { display: flex; flex-direction: column; gap: 4px; }
.detail-item .label { font-size: 12px; color: #909399; }
.detail-item span:last-child { font-size: 14px; color: #303133; }

.danger { color: #f56c6c !important; }

.gap-warning {
  margin-top: 16px;
  padding: 16px;
  background: #fdf6ec;
  border-left: 4px solid #e6a23c;
  border-radius: 4px;
}

.gap-warning-title {
  font-size: 14px;
  font-weight: 600;
  color: #8a6d3b;
  margin-bottom: 8px;
}

.gap-warning-body {
  font-size: 13px;
  color: #8a6d3b;
  line-height: 1.8;
}

.gap-warning-link {
  display: inline-block;
  margin-top: 10px;
  color: #409eff;
  font-weight: 600;
  text-decoration: none;
  font-size: 13px;
}

.gap-warning-link:hover { text-decoration: underline; }

.no-obs { color: #c0c4cc; font-size: 13px; }

.responsible-person {
  font-size: 13px;
  color: #303133;
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.handover-count {
  font-size: 11px;
  background: #ecf5ff;
  color: #409eff;
  padding: 1px 5px;
  border-radius: 3px;
}

.obs-view-link {
  font-size: 12px;
  color: #409eff;
  text-decoration: none;
}

.obs-view-link:hover { text-decoration: underline; }

.obs-info-section {
  margin-top: 16px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  border: 1px solid #ebeef5;
}

.obs-info-title {
  font-size: 14px;
  font-weight: 600;
  color: #303133;
  margin-bottom: 12px;
}

.obs-info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 10px;
}

.obs-info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.obs-info-item .label {
  font-size: 12px;
  color: #909399;
}

.obs-info-link {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.obs-info-link:hover { text-decoration: underline; }

.obs-handover-info {
  margin-top: 10px;
  padding: 8px 12px;
  background: #fff;
  border-radius: 4px;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.handover-label { color: #909399; }
.handover-detail { font-weight: 600; color: #303133; }
.handover-reason { color: #606266; }
.handover-time { color: #c0c4cc; margin-left: auto; }

.gap-warning.compact {
  margin-top: 10px;
  padding: 10px;
}

.row-highlight {
  background: #ecf5ff !important;
}

.highlight-flash {
  animation: flash-row 0.6s ease 3;
}

@keyframes flash-row {
  0%, 100% { background: #ecf5ff; }
  50% { background: #d9ecff; box-shadow: inset 0 0 0 2px #409eff; }
}
</style>
