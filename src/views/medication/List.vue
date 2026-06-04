<template>
  <div class="page-content">
    <div class="page-header">
      <h2 class="page-title">术后用药管理</h2>
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
          style="width: 180px"
          @change="loadData"
        >
          <el-option label="待护士核对" value="pending" />
          <el-option label="护士已核对" value="nurse_confirmed" />
          <el-option label="医生已复核" value="surgeon_verified" />
          <el-option label="患者已确认" value="patient_acknowledged" />
          <el-option label="已完成" value="completed" />
          <el-option label="异常" value="exception" />
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
        :data="medicationTasks"
        v-loading="loading"
        size="default"
        style="width: 100%"
      >
        <el-table-column label="患者" width="120">
          <template #default="{ row }">
            <div class="patient-cell">
              <el-avatar :size="36" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                {{ row.patientName?.charAt(0) }}
              </el-avatar>
              <div>
                <div class="patient-name">{{ row.patientName }}</div>
                <div class="patient-info">{{ row.eye }} · {{ row.surgeryType }}</div>
              </div>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="surgeryDate" label="手术日期" width="120" />

        <el-table-column label="用药明细" min-width="300">
          <template #default="{ row }">
            <div class="medication-items">
              <div
                v-for="item in row.items?.slice(0, 2)"
                :key="item.id"
                class="medication-item"
              >
                <el-tag size="small" type="primary">{{ item.name }}</el-tag>
                <span class="item-desc">{{ item.dosage }} {{ item.frequency }}</span>
              </div>
              <el-tag
                v-if="row.items?.length > 2"
                size="small"
                type="info"
              >
                还有 {{ row.items.length - 2 }} 种
              </el-tag>
            </div>
          </template>
        </el-table-column>

        <el-table-column prop="surgeonName" label="主刀医生" width="100" />

        <el-table-column prop="nurseName" label="核对护士" width="100">
          <template #default="{ row }">
            <span v-if="row.nurseName">{{ row.nurseName }}</span>
            <span v-else class="text-muted">待核对</span>
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

        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="handleView(row)"
            >
              查看详情
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
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Refresh, Search, WarningFilled } from '@element-plus/icons-vue'
import { useAppStore } from '@/store/useAppStore'
import { useAuthStore } from '@/store/useAuthStore'
import type { MedicationTask } from '@/types'

const router = useRouter()
const appStore = useAppStore()
const authStore = useAuthStore()

const loading = ref(false)
const processing = ref(false)
const medicationTasks = ref<MedicationTask[]>([])
const processDialogVisible = ref(false)
const currentTask = ref<MedicationTask | null>(null)

const filters = reactive({
  status: '',
  has_risk: undefined as boolean | undefined,
  patient_name: ''
})

const processForm = reactive({
  action: '',
  status: '',
  remark: '',
  nurse_name: ''
})

const processDialogTitle = computed(() => {
  if (!currentTask.value) return '处理'
  const map: Record<string, string> = {
    pending: '护士核对用药',
    nurse_confirmed: '医生复核用药',
    surgeon_verified: '患者确认用药',
    patient_acknowledged: '完成用药指导'
  }
  return map[currentTask.value.status] || '处理'
})

async function loadData() {
  loading.value = true
  try {
    const params: any = {}
    if (filters.status) params.status = filters.status
    if (filters.has_risk !== undefined) params.has_risk = filters.has_risk
    if (filters.patient_name) params.patient_name = filters.patient_name

    await appStore.fetchMedicationTasks(params)
    medicationTasks.value = appStore.medicationTasks
  } finally {
    loading.value = false
  }
}

function resetFilters() {
  filters.status = ''
  filters.has_risk = undefined
  filters.patient_name = ''
  loadData()
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

function canProcess(row: MedicationTask) {
  const role = authStore.role
  if (row.status === 'pending' && role === 'nurse') return true
  if (row.status === 'nurse_confirmed' && role === 'surgeon') return true
  if (row.status === 'surgeon_verified' && role === 'nurse') return true
  if (row.status === 'patient_acknowledged' && role === 'nurse') return true
  return false
}

function getProcessButtonText(row: MedicationTask) {
  const map: Record<string, string> = {
    pending: '核对用药',
    nurse_confirmed: '复核用药',
    surgeon_verified: '患者确认',
    patient_acknowledged: '完成指导'
  }
  return map[row.status] || '处理'
}

function handleView(row: MedicationTask) {
  router.push(`/medication/${row.id}`)
}

function handleProcess(row: MedicationTask) {
  currentTask.value = row
  processForm.remark = ''
  processForm.nurse_name = authStore.user?.name || ''

  const actionMap: Record<string, { action: string; status: string }> = {
    pending: { action: 'nurse_confirm', status: 'nurse_confirmed' },
    nurse_confirmed: { action: 'surgeon_verify', status: 'surgeon_verified' },
    surgeon_verified: { action: 'patient_ack', status: 'patient_acknowledged' },
    patient_acknowledged: { action: 'complete', status: 'completed' }
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
    await appStore.processMedication(currentTask.value.id, {
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

.text-muted {
  color: #c0c4cc;
  font-size: 13px;
}

.medication-items {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.medication-item {
  display: flex;
  align-items: center;
  gap: 6px;
  background: #f5f7fa;
  padding: 4px 8px;
  border-radius: 4px;
}

.item-desc {
  font-size: 12px;
  color: #606266;
}
</style>
