<template>
  <div class="page-content">
    <div class="page-header">
      <div>
        <el-button
          type="primary"
          plain
          :icon="ArrowLeft"
          @click="$router.back()"
          style="margin-right: 12px"
        >
          返回
        </el-button>
        <span class="page-title">复诊详情</span>
      </div>
      <el-button
        v-if="canProcess"
        type="primary"
        :icon="Check"
        @click="handleProcess"
      >
        {{ getProcessButtonText() }}
      </el-button>
    </div>

    <div v-loading="loading" v-if="detail" class="detail-content">
      <el-row :gutter="20">
        <el-col :span="16">
          <div class="card-wrapper">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#67c23a"><User /></el-icon>
                患者信息
              </h3>
              <el-tag :type="getStatusType(detail.status)" effect="dark">
                {{ detail.statusText }}
              </el-tag>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="患者姓名">{{ detail.patientName }}</el-descriptions-item>
              <el-descriptions-item label="联系电话">{{ detail.phone }}</el-descriptions-item>
              <el-descriptions-item label="手术类型">{{ detail.surgeryType }}</el-descriptions-item>
              <el-descriptions-item label="手术日期">{{ detail.surgeryDate }}</el-descriptions-item>
              <el-descriptions-item label="复诊类型">
                <el-tag type="success" size="small">{{ detail.followupType }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="随访专员">
                {{ detail.specialistName || '待分配' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="card-wrapper" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#409EFF"><Calendar /></el-icon>
                复诊安排
              </h3>
              <div class="schedule-badge">
                <el-icon color="#e6a23c"><Warning /></el-icon>
                请按时复诊
              </div>
            </div>

            <div class="schedule-info">
              <div class="schedule-item">
                <div class="schedule-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                  <el-icon :size="24"><Calendar /></el-icon>
                </div>
                <div class="schedule-content">
                  <div class="schedule-label">复诊日期</div>
                  <div class="schedule-value">{{ detail.scheduledDate }}</div>
                </div>
              </div>
              <div class="schedule-item">
                <div class="schedule-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                  <el-icon :size="24"><Clock /></el-icon>
                </div>
                <div class="schedule-content">
                  <div class="schedule-label">复诊时间</div>
                  <div class="schedule-value">{{ detail.scheduledTime }}</div>
                </div>
              </div>
            </div>

            <div class="content-box">
              <div class="content-label">复诊内容</div>
              <div class="content-text">{{ detail.content }}</div>
            </div>

            <div v-if="detail.hasRisk" class="risk-alert">
              <el-alert
                :title="'风险提示: ' + (detail.riskReason || '复诊存在风险，请重点关注')"
                type="error"
                :closable="false"
                show-icon
              />
            </div>
          </div>

          <div v-if="detail.previousTask" class="card-wrapper" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#909399"><Link /></el-icon>
                关联的上次复诊
              </h3>
              <el-button
                type="primary"
                size="small"
                link
                @click="goToTask(detail.previousTask.id)"
              >
                查看详情
              </el-button>
            </div>
            <div class="related-task">
              <el-tag size="small" type="info">{{ detail.previousTask.followupType }}</el-tag>
              <span class="related-date">{{ detail.previousTask.scheduledDate }}</span>
              <el-tag size="small" :type="getStatusType(detail.previousTask.status)">
                {{ detail.previousTask.statusText }}
              </el-tag>
            </div>
          </div>

          <div v-if="detail.nextTasks?.length" class="card-wrapper" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#909399"><Link /></el-icon>
                后续复诊安排
              </h3>
            </div>
            <div class="related-tasks">
              <div
                v-for="task in detail.nextTasks"
                :key="task.id"
                class="related-task"
              >
                <el-tag size="small" type="success">{{ task.followupType }}</el-tag>
                <span class="related-date">{{ task.scheduledDate }} {{ task.scheduledTime }}</span>
                <el-tag size="small" :type="getStatusType(task.status)">
                  {{ task.statusText }}
                </el-tag>
                <el-button
                  type="primary"
                  size="small"
                  link
                  @click="goToTask(task.id)"
                >
                  查看
                </el-button>
              </div>
            </div>
          </div>

          <div class="card-wrapper" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#e6a23c"><Clock /></el-icon>
                完整流转历史
                <el-tag size="small" type="warning" effect="dark" style="margin-left: 8px">
                  为什么这样流转？
                </el-tag>
              </h3>
            </div>

            <el-timeline class="timeline-wrapper">
              <el-timeline-item
                v-for="log in operationLogs"
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
                    <span class="remark-label">备注说明：</span>
                    <span>{{ log.remark }}</span>
                  </div>
                </el-card>
              </el-timeline-item>

              <div v-if="!operationLogs.length" class="empty-logs">
                <el-empty description="暂无流转记录" :image-size="80" />
              </div>
            </el-timeline>
          </div>
        </el-col>

        <el-col :span="8">
          <div class="card-wrapper">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#909399"><InfoFilled /></el-icon>
                当前状态
              </h3>
            </div>

            <div class="status-flow">
              <div
                v-for="(step, index) in statusSteps"
                :key="step.status"
                class="status-step"
              >
                <div
                  class="step-dot"
                  :class="{
                    active: getStepIndex(detail.status) >= index,
                    current: detail.status === step.status
                  }"
                >
                  <el-icon v-if="getStepIndex(detail.status) > index"><Check /></el-icon>
                  <span v-else>{{ index + 1 }}</span>
                </div>
                <div class="step-info">
                  <div class="step-name" :class="{ active: getStepIndex(detail.status) >= index }">
                    {{ step.text }}
                  </div>
                </div>
                <div
                  v-if="index < statusSteps.length - 1"
                  class="step-line"
                  :class="{ active: getStepIndex(detail.status) > index }"
                />
              </div>
            </div>
          </div>

          <div class="card-wrapper" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#909399"><Document /></el-icon>
                任务信息
              </h3>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ formatTime(detail.createdAt) }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">更新时间</span>
              <span class="info-value">{{ formatTime(detail.updatedAt) }}</span>
            </div>
          </div>

          <div class="card-wrapper action-card" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#e6a23c"><Operation /></el-icon>
                快捷操作
              </h3>
            </div>
            <div class="action-buttons">
              <el-button
                v-if="canMarkMissed"
                type="danger"
                plain
                block
                @click="handleMarkMissed"
              >
                <el-icon><Close /></el-icon>
                标记未到诊
              </el-button>
              <el-button
                v-if="canReschedule"
                type="warning"
                plain
                block
                @click="handleReschedule"
              >
                <el-icon><Refresh /></el-icon>
                改期安排
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="processDialogVisible"
      :title="processDialogTitle"
      width="520px"
      :close-on-click-modal="false"
    >
      <el-form :model="processForm" label-width="100px">
        <el-form-item v-if="showScheduleFields" label="新复诊日期" required>
          <el-date-picker
            v-model="processForm.scheduled_date"
            type="date"
            placeholder="选择日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item v-if="showScheduleFields" label="新复诊时间" required>
          <el-time-picker
            v-model="processForm.scheduled_time"
            placeholder="选择时间"
            value-format="HH:mm"
            style="width: 100%"
          />
        </el-form-item>

        <el-form-item label="处理备注" required>
          <el-input
            v-model="processForm.remark"
            type="textarea"
            :rows="3"
            placeholder="请输入处理备注（说明为什么要这样处理）"
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
import {
  ArrowLeft,
  Check,
  User,
  Calendar,
  Clock,
  Warning,
  Link,
  Right,
  InfoFilled,
  Document,
  Operation,
  Close,
  Refresh
} from '@element-plus/icons-vue'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { OperationLog } from '@/types'

const route = useRoute()
const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const loading = ref(false)
const processing = ref(false)
const detail = ref<any>(null)
const operationLogs = ref<OperationLog[]>([])
const processDialogVisible = ref(false)

const statusSteps = [
  { status: 'pending', text: '待联系' },
  { status: 'notified', text: '已通知' },
  { status: 'confirmed', text: '已确认' },
  { status: 'completed', text: '复诊完成' }
]

const processForm = reactive({
  action: '',
  status: '',
  remark: '',
  specialist_name: '',
  scheduled_date: '',
  scheduled_time: ''
})

const processDialogTitle = computed(() => {
  const map: Record<string, string> = {
    notify_patient: '通知患者',
    confirm_attendance: '确认到诊',
    complete_followup: '完成复诊',
    mark_missed: '标记未到诊',
    reschedule: '改期安排'
  }
  return map[processForm.action] || '处理'
})

const showScheduleFields = computed(() => {
  return processForm.action === 'reschedule'
})

const canProcess = computed(() => {
  if (!detail.value) return false
  const role = authStore.role
  if (role !== 'specialist') return false
  const status = detail.value.status
  if (status === 'pending') return true
  if (status === 'notified') return true
  if (status === 'confirmed') return true
  if (status === 'rescheduled') return true
  return false
})

const canMarkMissed = computed(() => {
  if (!detail.value) return false
  const role = authStore.role
  if (role !== 'specialist') return false
  return ['notified', 'confirmed', 'rescheduled'].includes(detail.value.status)
})

const canReschedule = computed(() => {
  if (!detail.value) return false
  const role = authStore.role
  if (role !== 'specialist') return false
  return ['notified', 'confirmed', 'missed'].includes(detail.value.status)
})

function getProcessButtonText() {
  if (!detail.value) return '处理'
  const map: Record<string, string> = {
    pending: '通知患者',
    notified: '确认到诊',
    confirmed: '完成复诊',
    rescheduled: '重新通知'
  }
  return map[detail.value.status] || '处理'
}

function getStepIndex(status: string) {
  return statusSteps.findIndex(s => s.status === status)
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

function formatTime(time: string) {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

async function loadData() {
  const id = route.params.id as string
  loading.value = true
  try {
    detail.value = await appStore.getFollowupDetail(id)
    operationLogs.value = await appStore.getOperationLogs(id)
  } finally {
    loading.value = false
  }
}

function goToTask(id: string) {
  router.push(`/followup/${id}`)
}

function handleProcess() {
  if (!detail.value) return

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

  const config = actionMap[detail.value.status]
  if (config) {
    processForm.action = config.action
    processForm.status = config.status
  }

  processDialogVisible.value = true
}

async function handleMarkMissed() {
  if (!detail.value) return

  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请说明未到诊原因',
      '标记未到诊',
      {
        confirmButtonText: '确认标记',
        cancelButtonText: '取消',
        inputPlaceholder: '请输入未到诊原因',
        inputValidator: (value) => !!value?.trim() || '请输入原因说明'
      }
    )

    processing.value = true
    try {
      await appStore.processFollowup(detail.value.id, {
        action: 'mark_missed',
        status: 'missed',
        remark: reason.trim(),
        specialist_name: authStore.user?.name
      })
      ElMessage.success('标记成功')
      loadData()
    } finally {
      processing.value = false
    }
  } catch {
    // 用户取消
  }
}

function handleReschedule() {
  if (!detail.value) return

  processForm.remark = ''
  processForm.specialist_name = authStore.user?.name || ''
  processForm.scheduled_date = ''
  processForm.scheduled_time = ''
  processForm.action = 'reschedule'
  processForm.status = 'rescheduled'

  processDialogVisible.value = true
}

async function confirmProcess() {
  if (!detail.value) return

  if (showScheduleFields.value && (!processForm.scheduled_date || !processForm.scheduled_time)) {
    ElMessage.warning('请选择新的复诊日期和时间')
    return
  }

  if (!processForm.remark) {
    ElMessage.warning('请输入处理备注，说明为什么要这样处理')
    return
  }

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

    await appStore.processFollowup(detail.value.id, data)
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
.detail-content {
  min-height: calc(100vh - 100px);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
}

.schedule-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #e6a23c;
  font-size: 13px;
  font-weight: 500;
}

.schedule-info {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.schedule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
}

.schedule-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.schedule-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 4px;
}

.schedule-value {
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.content-box {
  padding: 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409EFF;
}

.content-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 6px;
}

.content-text {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
}

.risk-alert {
  margin-top: 16px;
}

.related-task,
.related-tasks .related-task {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 8px;
}

.related-tasks .related-task:last-child {
  margin-bottom: 0;
}

.related-date {
  flex: 1;
  color: #606266;
  font-size: 14px;
}

.timeline-card {
  border: 1px solid #ebeef5;
  padding: 14px 18px;
  margin-bottom: 12px;
}

.log-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
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
  line-height: 1.6;
  margin-bottom: 8px;
}

.log-status-flow {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.arrow-icon {
  color: #c0c4cc;
}

.log-remark {
  padding: 10px 14px;
  background: #fff7e6;
  border-radius: 6px;
  font-size: 13px;
  color: #606266;
  border-left: 3px solid #e6a23c;
}

.remark-label {
  color: #e6a23c;
  font-weight: 500;
}

.status-flow {
  padding: 10px 0;
}

.status-step {
  display: flex;
  align-items: center;
  position: relative;
  padding-bottom: 30px;
}

.status-step:last-child {
  padding-bottom: 0;
}

.step-dot {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #f0f2f5;
  color: #c0c4cc;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  z-index: 1;
  transition: all 0.3s;
}

.step-dot.active {
  background: #67c23a;
  color: #fff;
}

.step-dot.current {
  background: #409EFF;
  color: #fff;
  box-shadow: 0 0 0 4px rgba(64, 158, 255, 0.2);
}

.step-info {
  margin-left: 12px;
  flex: 1;
}

.step-name {
  font-size: 14px;
  color: #c0c4cc;
  font-weight: 500;
}

.step-name.active {
  color: #303133;
}

.step-line {
  position: absolute;
  left: 15px;
  top: 32px;
  width: 2px;
  height: calc(100% - 32px);
  background: #f0f2f5;
}

.step-line.active {
  background: #67c23a;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #f0f2f5;
}

.info-item:last-child {
  border-bottom: none;
}

.info-label {
  color: #909399;
  font-size: 14px;
}

.info-value {
  color: #303133;
  font-size: 14px;
  font-weight: 500;
}

.action-card .action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.empty-logs {
  padding: 40px 0;
}

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
