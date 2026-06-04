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
        <span class="page-title">用药详情</span>
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
                <el-icon color="#409EFF"><User /></el-icon>
                患者信息
              </h3>
            </div>
            <el-descriptions :column="3" border>
              <el-descriptions-item label="患者姓名">{{ detail.patientName }}</el-descriptions-item>
              <el-descriptions-item label="手术类型">{{ detail.surgeryType }}</el-descriptions-item>
              <el-descriptions-item label="手术眼别">{{ detail.eye }}</el-descriptions-item>
              <el-descriptions-item label="手术日期">{{ detail.surgeryDate }}</el-descriptions-item>
              <el-descriptions-item label="主刀医生">{{ detail.surgeonName }}</el-descriptions-item>
              <el-descriptions-item label="核对护士">
                {{ detail.nurseName || '待核对' }}
              </el-descriptions-item>
            </el-descriptions>
          </div>

          <div class="card-wrapper" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#67c23a"><Box /></el-icon>
                用药清单
              </h3>
              <el-tag :type="getStatusType(detail.status)" effect="dark">
                {{ detail.statusText }}
              </el-tag>
            </div>

            <el-table :data="detail.items" size="small">
              <el-table-column prop="name" label="药品名称" width="180" />
              <el-table-column prop="specification" label="规格" width="140" />
              <el-table-column prop="dosage" label="剂量" width="100" />
              <el-table-column prop="frequency" label="频次" width="120" />
              <el-table-column prop="duration" label="疗程" width="100" />
              <el-table-column prop="notes" label="备注" />
            </el-table>

            <div v-if="detail.hasRisk" class="risk-alert">
              <el-alert
                :title="'风险提示: ' + (detail.riskReason || '用药存在风险，请谨慎处理')"
                type="error"
                :closable="false"
                show-icon
              />
            </div>
          </div>

          <div class="card-wrapper" style="margin-top: 20px">
            <div class="section-header">
              <h3 class="section-title">
                <el-icon color="#e6a23c"><Clock /></el-icon>
                流转历史
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
                    <el-tag size="small" type="primary">{{ log.action }}</el-tag>
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
        </el-col>
      </el-row>
    </div>

    <el-dialog
      v-model="processDialogVisible"
      :title="processDialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="processForm" label-width="100px">
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
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import dayjs from 'dayjs'
import {
  ArrowLeft,
  Check,
  User,
  Box,
  Clock,
  Right,
  InfoFilled,
  Document
} from '@element-plus/icons-vue'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { MedicationTask, OperationLog } from '@/types'

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
  { status: 'pending', text: '待护士核对' },
  { status: 'nurse_confirmed', text: '护士已核对' },
  { status: 'surgeon_verified', text: '医生已复核' },
  { status: 'patient_acknowledged', text: '患者已确认' },
  { status: 'completed', text: '已完成' }
]

const processForm = reactive({
  action: '',
  status: '',
  remark: '',
  nurse_name: ''
})

const processDialogTitle = computed(() => {
  if (!detail.value) return '处理'
  const map: Record<string, string> = {
    pending: '护士核对用药',
    nurse_confirmed: '医生复核用药',
    surgeon_verified: '患者确认用药',
    patient_acknowledged: '完成用药指导'
  }
  return map[detail.value.status] || '处理'
})

const canProcess = computed(() => {
  if (!detail.value) return false
  const role = authStore.role
  const status = detail.value.status
  if (status === 'pending' && role === 'nurse') return true
  if (status === 'nurse_confirmed' && role === 'surgeon') return true
  if (status === 'surgeon_verified' && role === 'nurse') return true
  if (status === 'patient_acknowledged' && role === 'nurse') return true
  return false
})

function getProcessButtonText() {
  if (!detail.value) return '处理'
  const map: Record<string, string> = {
    pending: '核对用药',
    nurse_confirmed: '复核用药',
    surgeon_verified: '患者确认',
    patient_acknowledged: '完成指导'
  }
  return map[detail.value.status] || '处理'
}

function getStepIndex(status: string) {
  return statusSteps.findIndex(s => s.status === status)
}

function getStatusType(status: string) {
  const map: Record<string, string> = {
    pending: 'warning',
    nurse_confirmed: 'primary',
    surgeon_verified: 'success',
    patient_acknowledged: 'info',
    completed: 'success',
    exception: 'danger'
  }
  return map[status] || 'info'
}

function getStatusText(status: string) {
  const map: Record<string, string> = {
    pending: '待护士核对',
    nurse_confirmed: '护士已核对',
    surgeon_verified: '医生已复核',
    patient_acknowledged: '患者已确认',
    completed: '已完成',
    exception: '异常'
  }
  return map[status] || status
}

function getTimelineType(oldStatus?: string, newStatus?: string) {
  if (!oldStatus || !newStatus) return ''
  if (newStatus === 'completed') return 'success'
  if (newStatus === 'exception') return 'danger'
  return 'primary'
}

function formatTime(time: string) {
  return time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'
}

async function loadData() {
  const id = route.params.id as string
  loading.value = true
  try {
    detail.value = await appStore.getMedicationDetail(id)
    operationLogs.value = await appStore.getOperationLogs(id)
  } finally {
    loading.value = false
  }
}

function handleProcess() {
  if (!detail.value) return

  processForm.remark = ''
  processForm.nurse_name = authStore.user?.name || ''

  const actionMap: Record<string, { action: string; status: string }> = {
    pending: { action: 'nurse_confirm', status: 'nurse_confirmed' },
    nurse_confirmed: { action: 'surgeon_verify', status: 'surgeon_verified' },
    surgeon_verified: { action: 'patient_ack', status: 'patient_acknowledged' },
    patient_acknowledged: { action: 'complete', status: 'completed' }
  }

  const config = actionMap[detail.value.status]
  if (config) {
    processForm.action = config.action
    processForm.status = config.status
  }

  processDialogVisible.value = true
}

async function confirmProcess() {
  if (!detail.value) return

  processing.value = true
  try {
    await appStore.processMedication(detail.value.id, {
      action: processForm.action,
      status: processForm.status,
      remark: processForm.remark,
      nurse_name: processForm.nurse_name
    })
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

.risk-alert {
  margin-top: 16px;
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
  padding: 8px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 13px;
  color: #606266;
}

.remark-label {
  color: #909399;
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

:deep(.el-timeline-item__timestamp) {
  color: #909399;
  font-size: 12px;
}
</style>
