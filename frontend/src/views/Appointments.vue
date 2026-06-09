<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'

const router = useRouter()
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

function goToObservations() {
  router.push('/observations')
}

const expandedId = ref(null)
function toggleDetail(id) {
  expandedId.value = expandedId.value === id ? null : id
}

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
        <button class="btn btn-primary banner-btn" @click="goToObservations">前往留观记录 →</button>
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
              <th>预约时间</th>
              <th>医生</th>
              <th>护士</th>
              <th>状态</th>
              <th>流程</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="a in appointments" :key="a.id" :class="{ 'row-alert': needsObservation(a) }">
              <td>{{ a.id }}</td>
              <td>{{ a.residentName }}</td>
              <td>{{ a.vaccineName }}</td>
              <td>{{ a.appointmentDate }}</td>
              <td>{{ a.appointmentTime }}</td>
              <td>{{ a.doctorName || '-' }}</td>
              <td>{{ a.nurseName || '-' }}</td>
              <td>
                <span class="status-tag" :style="{ background: statusColors[a.status] + '1a', color: statusColors[a.status] }">
                  {{ statusLabels[a.status] }}
                </span>
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
                <router-link v-if="needsObservation(a)" to="/observations" class="obs-nav-link">→ 前往留观</router-link>
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
            <router-link to="/observations" class="gap-warning-link">立即前往留观记录 →</router-link>
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
</style>
