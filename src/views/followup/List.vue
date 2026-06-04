<template>
  <div class="page-content">
    <div class="page-header">
      <h2 class="page-title">复诊提醒管理</h2>
      <div class="header-actions">
        <el-button type="primary" :icon="Refresh" @click="loadData" :loading="loading">
          刷新
        </el-button>
      </div>
    </div>

    <div class="card-wrapper">
      <div class="filter-bar">
        <el-select
          v-model="filters.status"
          placeholder="状态筛选"
          clearable
          style="width: 160px"
          @change="loadData"
        >
          <el-option label="待联系" value="pending" />
          <el-option label="已通知待确认" value="notified" />
          <el-option label="已确认待复诊" value="confirmed" />
          <el-option label="复诊完成" value="completed" />
          <el-option label="已改期" value="rescheduled" />
          <el-option label="未到诊" value="missed" />
        </el-select>

        <el-select
          v-model="filters.followup_type"
          placeholder="复诊类型"
          clearable
          style="width: 140px"
          @change="loadData"
        >
          <el-option label="术后1天" value="术后1天" />
          <el-option label="术后1周" value="术后1周" />
          <el-option label="术后1月" value="术后1月" />
          <el-option label="术后3月" value="术后3月" />
        </el-select>

        <el-select
          v-model="filters.has_risk"
          placeholder="风险筛选"
          clearable
          style="width: 140px"
          @change="loadData"
        >
          <el-option label="有风险" :value="true" />
          <el-option label="无风险" :value="false" />
        </el-select>

        <el-input
          v-model="filters.patient_name"
          placeholder="搜索患者姓名"
          clearable
          style="width: 180px"
          @keyup.enter="loadData"
          @clear="loadData"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-button type="primary" plain @click="resetFilters">重置筛选</el-button>
      </div>

      <el-table
        :data="followupTasks"
        v-loading="loading"
        size="default"
        style="width: 100%"
      >
        <el-table-column label="患者" width="140">
          <template #default="{ row }">
            <div class="patient-cell">
              <el-avatar :size="36" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                {{ row.patientName?.charAt(0) }}
              </el-avatar>
              <div>
                <div class="patient-name">{{ row.patientName }}</div>
                <div class="patient-info">{{ row.phone }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="复诊信息" width="160">
          <template #default="{ row }">
            <div>
              <el-tag size="small" type="success" effect="light">{{ row.followupType }}</el-tag>
              <div class="surgery-info" style="margin-top: 4px">{{ row.surgeryType }}</div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="surgeryDate" label="手术日期" width="120" />

        <el-table-column label="复诊时间" width="160">
          <template #default="{ row }">
            <div class="schedule-time">
              <el-icon color="#409EFF"><Calendar /></el-icon>
              <span>{{ row.scheduledDate }}</span>
            </div>
            <div class="schedule-time">
              <el-icon color="#67c23a"><Clock /></el-icon>
              <span>{{ row.scheduledTime }}</span>
            </div>
          </template>
        </el-table-column>

        <el-table-column label="复诊内容" min-width="200" show-overflow-tooltip>
          <template #default="{ row }">
            {{ row.content }}
          </template>
        </el-table-column>

        <el-table-column prop="specialistName" label="随访专员" width="100">
          <template #default="{ row }">
            <span v-if="row.specialistName">{{ row.specialistName }}</span>
            <span v-else class="text-muted">待分配</span>
          </template>
        </el-table-column>

        <el-table-column label="状态" width="160">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small" effect="light">
              {{ row.statusText }}
            </el-tag>
            <el-tag
              v-if="row.hasRisk"
              size="small"
              type="danger"
              effect="dark"
              style="margin-left: 6px"
            >
              <el-icon><WarningFilled /></el-icon>
              风险
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column label="流转记录" width="100" align="center">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="showFlowHistory(row)"
            >
              <el-icon><View /></el-icon>
              查看
            </el-button>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleView(row)"
            >
              详情
            </el-button>
            <el-button
              v-if="canProcess(row)"
              type="success"
              size="small"
              link
              @click="handleProcess(row)"
            >
              {{ getProcessButtonText(row) }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog
      v-model="flowHistoryVisible"
      title="流转历史"
      width="600px"
    >
      <div v-if="currentFlowTask" class="flow-history-content">
        <div class="flow-history-header">
          <el-tag type="success" size="small">{{ currentFlowTask.followupType }}</el-tag>
          <span class="flow-patient">{{ currentFlowTask.patientName }}</span>
        </div>

        <el-timeline class="timeline-wrapper">
          <el-timeline-item
            v-for="log in flowLogs"
            :key="log.id"
            :timestamp="formatTime(log.createdAt)"
            placement="top"
            :type="getTimelineType(log.oldStatus, log.newStatus)"
          >
            <el-card shadow="never" class="timeline-card">
              <div class="log-header">
                <el-tag size="small" type="success">{{ log.action }}</el-tag>
                <span class="log-operator">
                  <el-icon><User /></el-icon>
                  {{ log.operatorName }} ({{ log.operatorRole }})
                </span>
              </div>
              <div class="log-desc">{{ log.description }}</div>
              <div v-if="log.oldStatus && log.newStatus" class="log-status-flow">
                <el-tag size="small" type="info">{{ getStatusText(log.oldStatus) }}</el-tag>
                <el-icon class="arrow-icon"><Right /></el-icon>
                <el-tag size="small" type="success">{{ getStatusText(log.newStatus) }}</el-tag>
              </div>
              <div v-if="log.remark" class="log-remark">
                <span class="remark-label">备注：</span>
                <span>{{ log.remark }}</span>
              </div>
            </el-card>
          </el-timeline-item>

          <div v-if="!flowLogs.length" class="empty-logs">
            <el-empty description="暂无流转记录" :image-size="60" />
          </div>
        </el-timeline>
      </div>
    </el-dialog>

    <el-dialog
      v-model="processDialogVisible"
      :title="processDialogTitle"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="processForm" label-width="100px">
        <el-form-item v-if="showScheduleFields" label="新复诊日期">
          <el-date-picker
            v-model="processForm.scheduled_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="showScheduleFields" label="新复诊时间">
          <el-time-picker
            v-model="processForm.scheduled_time"
            placeholder="选择时间"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="处理备注">
          <el-input
            v-model="processForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注（可选）"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="processDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="processing" @click="confirmProcess">
          确认处理
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import { Refresh, Search, WarningFilled, Calendar, Clock, View, User, Right } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { FollowupTask, OperationLog } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const loading = ref(false)
const processing = ref(false)
const followupTasks = ref<FollowupTask[]>([])
const flowHistoryVisible = ref(false)
const flowLogs = ref<OperationLog[]>([])
const currentFlowTask = ref<FollowupTask | null>(null)
const processDialogVisible = ref(false)
const currentTask = ref<FollowupTask | null>(null)

const filters = reactive({
  status: '',
  followup_type: '',
  has_risk: undefined as boolean | undefined,
  patient_name: ''
})

const processForm = reactive({
  action: '',
  status: '',
  remark: '',
  specialist_name: '',
  scheduled_date: '',
  scheduled_time: ''
})

const processDialogTitle = computed(() => {
  if (!currentTask.value) return '处理'
  const map: Record<string, string> = {
    pending: '通知患者',
    notified: '确认到诊',
    confirmed: '完成复诊',
    rescheduled: '重新通知'
  }
  return map[currentTask.value.status] || '处理'
})

const showScheduleFields = computed(() => {
  return currentTask.value?.status === 'rescheduled' || processForm.action === 'reschedule'
})

async function loadData() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.status) params.status = filters.status
    if (filters.followup_type) params.followup_type = filters.followup_type
    if (filters.has_risk !== undefined) params.has_risk = filters.has_risk
    if (filters.patient_name) params.patient_name = filters.patient_name

    await appStore.fetchFollowupTasks(params)
    followupTasks.value = appStore.followupTasks
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = ''
  filters.followup_type = ''
  filters.has_risk = undefined
  filters.patient_name = ''
  loadData()
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    notified: 'primary',
    confirmed: 'success',
    completed: 'success',
    rescheduled: 'info',
    missed: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待联系',
    notified: '已通知待确认',
    confirmed: '已确认待复诊',
    completed: '复诊完成',
    rescheduled: '已改期',
    missed: '未到诊'
  }
  return map[status] || status
}

function getTimelineType(oldStatus?: string, newStatus?: string) {
  if (!oldStatus || !newStatus) return ''
  if (newStatus === 'completed') return 'success'
  if (newStatus === 'missed') return 'danger'
  if (newStatus === 'rescheduled') return 'warning'
  return 'primary'
}

function canProcess(row: FollowupTask) {
  const role = authStore.role
  if (role !== 'specialist') return false
  if (row.status === 'pending') return true
  if (row.status === 'notified') return true
  if (row.status === 'confirmed') return true
  if (row.status === 'rescheduled') return true
  return false
}

function getProcessButtonText(row: FollowupTask) {
  const map: Record<string, string> = {
    pending: '通知患者',
    notified: '确认到诊',
    confirmed: '完成复诊',
    rescheduled: '重新通知'
  }
  return map[row.status] || '处理'
}

function formatTime(time: string) {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

function handleView(row: FollowupTask) {
  router.push(`/followup/${row.id}`)
}

async function showFlowHistory(row: FollowupTask) {
  currentFlowTask.value = row
  flowLogs.value = await appStore.getOperationLogs(row.id)
  flowHistoryVisible.value = true
}

function handleProcess(row: FollowupTask) {
  currentTask.value = row
  processForm.remark = ''
  processForm.specialist_name = authStore.user?.name || ''
  processForm.scheduled_date = ''
  processForm.scheduled_time = ''

  const actionMap: Record<string, { action: string; status: string }> = {
    pending: { action: 'notify_patient', status: 'notified' },
    notified: { action: 'confirm_attendance', status: 'confirmed' },
    confirmed: { action: 'complete_followup', status: 'completed' },
    rescheduled: { action: 'notify_patient', status: 'notified' }
  }

  const config = actionMap[row.status]
  if (config) {
    processForm.action = config.action
    processForm.status = config.status
  }

  processDialogVisible.value = true
}

async function confirmProcess() {
  if (!currentTask.value) return

  processing.value = true
  try {
    const data: any = {
      action: processForm.action,
      status: processForm.status,
      remark: processForm.remark,
      specialist_name: processForm.specialist_name
    }
    if (processForm.scheduled_date) data.scheduled_date = processForm.scheduled_date
    if (processForm.scheduled_time) data.scheduled_time = processForm.scheduled_time

    await appStore.processFollowup(currentTask.value.id, data)
    ElMessage.success('处理成功')
    processDialogVisible.value = false
    loadData()
  } finally {
    processing.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.header-actions {
  display: flex;
  gap: 10px;
}

.patient-cell {
  display: flex;
  align-items: center;
  gap: 12px;
}

.patient-name {
  font-weight: 600;
  color: #303133;
  margin-bottom: 2px;
}

.patient-info {
  font-size: 12px;
  color: #909399;
}

.surgery-info {
  font-size: 12px;
  color: #606266;
  margin-top: 4px;
}

.schedule-time {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #303133;
  margin-bottom: 2px;
}

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
}

.flow-history-content {
  padding: 10px 0;
}

.flow-history-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f2f5;
}

.flow-patient {
  font-weight: 600;
  color: #303133;
}

.timeline-card {
  border: 1px solid #ebeef5;
  padding: 12px 16px;
  margin-bottom: 10px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.log-operator {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #606266;
  font-size: 13px;
}

.log-desc {
  color: #303133;
  line-height: 1.5;
  margin-bottom: 6px;
  font-size: 13px;
}

.log-status-flow {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.arrow-icon {
  color: #c0c4cc;
  font-size: 12px;
}

.log-remark {
  padding: 6px 10px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.remark-label {
  color: #909399;
}

.empty-logs {
  padding: 30px 0;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
