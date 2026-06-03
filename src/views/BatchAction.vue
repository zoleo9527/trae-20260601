<template>
  <div class="batch-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">批量处理</h1>
        <p class="page-subtitle">批量处理多个订单的出库验机或归还复核</p>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="action-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><Operation /></el-icon>
              选择批量操作
            </div>
          </template>

          <div class="action-list">
            <div
              v-for="action in availableActions"
              :key="action.key"
              class="action-item card-hover"
              :class="{ active: selectedAction === action.key, disabled: !action.enabled }"
              @click="selectAction(action)"
            >
                <div class="action-icon" :style="{ background: action.color }">
                  <el-icon><component :is="action.icon" /></el-icon>
                </div>
                <div class="action-info">
                  <div class="action-name">{{ action.name }}</div>
                  <div class="action-desc">{{ action.description }}</div>
                  <div class="action-count">可选 {{ action.availableCount }} 笔</div>
                </div>
              </div>
          </div>
        </el-card>

        <el-card v-if="selectedAction" class="selected-info" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Select /></el-icon>
              选择订单
            </div>
          </template>

          <div class="selection-help">
            <el-checkbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="toggleAll"
            >
              全选
            </el-checkbox>
            <span class="selected-count">已选 {{ selectedIds.length }} 笔</span>
          </div>

          <div class="batch-list">
            <div
              v-for="item in availableList"
              :key="item.id"
              class="batch-item"
              :class="{ selected: selectedIds.includes(item.id) }"
              @click="toggleSelect(item)"
            >
              <el-checkbox :model-value="selectedIds.includes(item.id)" />
              <div class="batch-item-info">
                <div class="equipment-name">{{ item.equipment.name }}</div>
                <div class="order-no">{{ item.orderNo }}</div>
              </div>
              <div class="batch-item-status">
                <el-tag size="small" :type="getStatusType(item.status)">
                  {{ getStatusLabel(item.status) }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16">
        <el-card class="preview-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><Document /></el-icon>
              操作预览
            </div>
          </template>

          <div v-if="!selectedAction" class="empty-preview">
            <el-empty description="请先选择批量操作类型" />
          </div>

          <div v-else>
            <div class="preview-header">
              <h3>{{ getActionInfo().name }}</h3>
              <p>{{ getActionInfo().description }}</p>
            </div>

            <el-alert
              v-if="selectedAction === 'batch_start_outbound'"
              title="出库验机说明"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              批量开始验机仅将订单状态变更为「验机中」，您仍需逐个完成验机详情。
            </el-alert>

            <el-alert
              v-if="selectedAction === 'batch_start_return'"
              title="归还复核说明"
              type="info"
              :closable="false"
              style="margin-bottom: 20px;"
            >
              批量开始复核仅将订单状态变更为「复核中」，您仍需逐个完成复核详情。
            </el-alert>

            <div class="preview-section">
              <div class="preview-title">已选择的订单 ({{ selectedIds.length }} 笔)</div>
              <div class="preview-list">
                <el-table :data="selectedItems" size="small">
                  <el-table-column prop="orderNo" label="订单号" width="160">
                    <template #default="{ row }">
                      <span class="monospace">{{ row.orderNo }}</span>
                    </template>
                  </el-table-column>
                  <el-table-column label="器材" min-width="200">
                    <template #default="{ row }">
                      {{ row.equipment.name }}
                    </template>
                  </el-table-column>
                  <el-table-column prop="customer.name" label="客户" width="100" />
                  <el-table-column label="当前状态" width="140">
                    <template #default="{ row }">
                      <el-tag :type="getStatusType(row.status)">
                        {{ getStatusLabel(row.status) }}
                      </el-tag>
                    </template>
                  </el-table-column>
                  <el-table-column label="操作后状态" width="140">
                    <template #default="{ row }">
                      <el-icon color="#60a5fa"><ArrowRight /></el-icon>
                      <el-tag :type="getAfterStatusType()">
                        {{ getAfterStatusLabel() }}
                      </el-tag>
                    </template>
                  </el-table-column>
                </el-table>
              </div>
            </div>

            <div class="action-buttons">
              <el-button
                type="primary"
                size="large"
                :disabled="selectedIds.length === 0 || !canProcess"
                @click="executeBatch"
              >
                <el-icon><Check /></el-icon>
                执行批量操作
              </el-button>
            </div>

            <div v-if="needsApproval && !canApprove" class="approval-notice">
              <el-icon><InfoFilled /></el-icon>
              此操作需要经理权限，请切换到门店经理角色。
            </div>
          </div>
        </el-card>

        <el-card class="integration-card" style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><Link /></el-icon>
              暂未实现的集成点
            </div>
          </template>
          <div class="integration-list">
            <div
              v-for="point in integrationPoints"
              :key="point.id"
              class="integration-item"
            >
              <div class="integration-header">
                <span class="integration-name">{{ point.name }}</span>
                <el-tag size="small" type="info">待集成</el-tag>
              </div>
              <p class="integration-desc">{{ point.description }}</p>
              <div class="integration-location">
                <el-icon><Folder /></el-icon>
                <span>{{ point.mockDataLocation }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { STATUS_FLOW, STATUS_LABELS, INTEGRATION_POINTS } from '@/data/mockData'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const selectedAction = ref('')
const selectedIds = ref([])

const pendingOutbound = computed(() => equipmentStore.pendingOutbound)
const pendingReturn = computed(() => equipmentStore.pendingReturn)
const completedReturn = computed(() =>
  equipmentStore.allRentals.filter(r => r.status === STATUS_FLOW.RETURN_COMPLETED))

const availableActions = computed(() => [
  {
    key: 'batch_start_outbound',
    name: '批量开始出库验机',
    description: '将多个待出库订单标记为验机中',
    icon: 'Upload',
    color: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    enabled: authStore.hasPermission('batch:process'),
    availableCount: pendingOutbound.value.filter(r => r.status === STATUS_FLOW.PENDING_OUTBOUND).length,
    needApproval: false
  },
  {
    key: 'batch_start_return',
    name: '批量开始归还复核',
    description: '将多个待归还订单标记为复核中',
    icon: 'Download',
    color: 'linear-gradient(135deg, #fbbf24, #f59e0b)',
    enabled: authStore.hasPermission('batch:process'),
    availableCount: pendingReturn.value.filter(r => r.status === STATUS_FLOW.PENDING_RETURN).length,
    needApproval: false
  },
  {
    key: 'batch_close',
    name: '批量结案',
    description: '将已完成复核的订单批量结案',
    icon: 'Check',
    color: 'linear-gradient(135deg, #34d399, #10b981)',
    enabled: authStore.hasPermission('batch:approve'),
    availableCount: completedReturn.value.length,
    needApproval: true
  }
])

const availableList = computed(() => {
  if (selectedAction.value === 'batch_start_outbound') {
    return pendingOutbound.value.filter(r => r.status === STATUS_FLOW.PENDING_OUTBOUND)
  }
  if (selectedAction.value === 'batch_start_return') {
    return pendingReturn.value.filter(r => r.status === STATUS_FLOW.PENDING_RETURN)
  }
  if (selectedAction.value === 'batch_close') {
    return completedReturn.value
  }
  return []
})

const selectedItems = computed(() =>
  availableList.value.filter(r => selectedIds.value.includes(r.id)))

const isAllSelected = computed(() =>
  availableList.value.length > 0 && selectedIds.value.length === availableList.value.length)

const isIndeterminate = computed(() =>
  selectedIds.value.length > 0 && selectedIds.value.length < availableList.value.length)

const needsApproval = computed(() => {
  const action = availableActions.value.find(a => a.key === selectedAction.value)
  return action?.needApproval || false
})

const canProcess = computed(() => {
  if (!authStore.hasPermission('batch:process')) return false
  if (needsApproval.value && !authStore.hasPermission('batch:approve')) return false
  return true
})

const canApprove = computed(() => authStore.hasPermission('batch:approve'))

const integrationPoints = computed(() => INTEGRATION_POINTS)

const getStatusLabel = (status) => STATUS_LABELS[status]?.label || status
const getStatusType = (status) => STATUS_LABELS[status]?.type || 'info'

const getActionInfo = () => {
  return availableActions.value.find(a => a.key === selectedAction.value) || {}
}

const getAfterStatusLabel = () => {
  if (selectedAction.value === 'batch_start_outbound') return '验机中'
  if (selectedAction.value === 'batch_start_return') return '复核中'
  if (selectedAction.value === 'batch_close') return '已结案'
  return ''
}

const getAfterStatusType = () => {
  if (selectedAction.value === 'batch_close') return 'success'
  return 'warning'
}

const selectAction = (action) => {
  if (!action.enabled) {
    ElMessage.warning('您没有该操作的权限')
    return
  }
  selectedAction.value = action.key
  selectedIds.value = []
}

const toggleSelect = (item) => {
  const idx = selectedIds.value.indexOf(item.id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(item.id)
  }
}

const toggleAll = (val) => {
  if (val) {
    selectedIds.value = availableList.value.map(r => r.id)
  } else {
    selectedIds.value = []
  }
}

const executeBatch = async () => {
  if (selectedIds.value.length === 0) {
    ElMessage.warning('请至少选择一个订单')
    return
  }

  const actionName = getActionInfo().name

  try {
    await ElMessageBox.confirm(
      `确定要对选中的 ${selectedIds.value.length} 笔订单执行「${actionName}」吗？`,
      '批量操作确认',
      { type: 'warning' }
    )

    const results = equipmentStore.batchAction(selectedAction.value, selectedIds.value)

    if (results.success.length > 0) {
      ElMessage.success(`成功处理 ${results.success.length} 笔订单`)
    }
    if (results.failed.length > 0) {
      ElMessage.error(`${results.failed.length} 笔订单处理失败`)
    }

    selectedIds.value = []
  } catch (e) {
    if (e !== 'cancel') {
      ElMessage.error('批量操作失败')
    }
  }
}
</script>

<style scoped>
.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.action-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  cursor: pointer;
  transition: all 0.2s;
}

.action-item:hover {
  border-color: #60a5fa;
}

.action-item.active {
  border-color: #3b82f6;
  background: #eff6ff;
}

.action-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.action-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  flex-shrink: 0;
}

.action-info {
  flex: 1;
}

.action-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 4px;
}

.action-count {
  font-size: 11px;
  color: #3b82f6;
  font-weight: 600;
}

.selection-help {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.selected-count {
  font-size: 13px;
  color: #6b7280;
}

.batch-list {
  max-height: 400px;
  overflow-y: auto;
}

.batch-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 6px;
  border: 1px solid #e5e7eb;
  transition: all 0.15s;
}

.batch-item:hover {
  background: #f9fafb;
}

.batch-item.selected {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.batch-item-info {
  flex: 1;
}

.equipment-name {
  font-weight: 500;
  color: #1f2937;
}

.order-no {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

.empty-preview {
  padding: 60px 0;
}

.preview-header {
  margin-bottom: 20px;
}

.preview-header h3 {
  margin: 0 0 8px 0;
  color: #1f2937;
}

.preview-header p {
  margin: 0;
  color: #6b7280;
  font-size: 13px;
}

.preview-title {
  font-weight: 600;
  color: #374151;
  margin-bottom: 12px;
}

.action-buttons {
  margin-top: 20px;
  text-align: center;
}

.approval-notice {
  margin-top: 12px;
  padding: 12px;
  background: #fef3c7;
  border-radius: 6px;
  color: #92400e;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.integration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.integration-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.integration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.integration-name {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.integration-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.integration-location {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #1e40af;
  font-family: monospace;
}

.monospace {
  font-family: monospace;
  font-size: 12px;
}
</style>
