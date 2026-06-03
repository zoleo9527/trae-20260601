<template>
  <div class="return-pending-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">待归还复核</h1>
        <p class="page-subtitle">共有 {{ pendingList.length }} 笔订单等待归还复核</p>
      </div>
      <div class="header-actions">
        <el-button :disabled="selectedIds.length === 0" @click="handleBatchStart">
          <el-icon><Select /></el-icon>
          批量开始复核 ({{ selectedIds.length }})
        </el-button>
      </div>
    </div>

    <el-table
      :data="pendingList"
      v-loading="loading"
      @selection-change="handleSelectionChange"
      style="width: 100%"
    >
      <el-table-column type="selection" width="55" />
      <el-table-column prop="orderNo" label="订单号" width="160" fixed="left">
        <template #default="{ row }">
          <span class="monospace">{{ row.orderNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="器材信息" min-width="240">
        <template #default="{ row }">
          <div class="equipment-cell">
            <div class="equipment-name">{{ row.equipment.name }}</div>
            <div class="equipment-meta">
              <el-tag size="mini" type="info">{{ row.equipment.category }}</el-tag>
              <span class="serial">{{ row.equipment.serialNo }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="customer.name" label="客户" width="100" />
      <el-table-column label="租期" width="140">
        <template #default="{ row }">
          <div>{{ row.rentalPeriod.days }}天</div>
          <div style="font-size: 11px; color: #9ca3af;">
            {{ row.rentalPeriod.start }}
          </div>
        </template>
      </el-table-column>
      <el-table-column label="出库验机" width="160">
        <template #default="{ row }">
          <div class="outbound-info">
            <div class="inspector">{{ row.outboundInspection?.inspector || '-' }}</div>
            <div class="time">{{ formatTime(row.outboundInspection?.inspectedAt) }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="出库关键判断" min-width="200">
        <template #default="{ row }">
          <div class="key-points-preview">
            <div
              v-for="(point, index) in getKeyPoints(row)"
              :key="index"
              class="key-point-tag"
              :class="{ 'abnormal': point.result === 'abnormal' }"
            >
              <el-icon size="10">
                <component :is="point.result === 'abnormal' ? 'Warning' : 'Check'" />
              </el-icon>
              <span>{{ point.label }}</span>
            </div>
            <div v-if="getKeyPoints(row).length === 0" class="no-key-points">
              无特殊标记
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="130">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)" effect="dark">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="140" fixed="right">
        <template #default="{ row }">
          <el-button
            v-if="row.status === 'pending_return'"
            type="warning"
            size="small"
            @click="startReview(row.id)"
          >
            开始复核
          </el-button>
          <el-button
            v-else
            type="warning"
            size="small"
            @click="continueReview(row.id)"
          >
            继续复核
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="integration-point">
      <el-icon><InfoFilled /></el-icon>
      <strong>核心设计：</strong>
      归还复核时，系统自动展示出库验机时标记的「关键判断」，确保一线同事基于同一基准进行对比。
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { STATUS_FLOW, STATUS_LABELS, INSPECTION_ITEMS } from '@/data/mockData'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const loading = ref(false)
const selectedIds = ref([])

const pendingList = computed(() => equipmentStore.pendingReturn)
const canEdit = computed(() => authStore.hasPermission('return:review'))

const getStatusLabel = (status) => STATUS_LABELS[status]?.label || status
const getStatusType = (status) => STATUS_LABELS[status]?.type || 'info'

const getKeyPoints = (rental) => {
  return equipmentStore.getOutboundKeyPoints(rental)
    .map(p => ({
      key: p.key,
      label: INSPECTION_ITEMS.find(i => i.key === p.key)?.label || p.key,
      result: p.result
    }))
}

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  const date = new Date(timestamp)
  return date.toLocaleDateString('zh-CN')
}

const handleSelectionChange = (selection) => {
  selectedIds.value = selection
    .filter(r => r.status === STATUS_FLOW.PENDING_RETURN)
    .map(r => r.id)
}

const startReview = (id) => {
  if (!canEdit.value) {
    ElMessage.warning('您没有操作权限，请切换到一线操作员角色')
    return
  }
  equipmentStore.startReturnInspection(id)
  router.push(`/return/review/${id}`)
}

const continueReview = (id) => {
  router.push(`/return/review/${id}`)
}

const handleBatchStart = async () => {
  if (!canEdit.value) {
    ElMessage.warning('您没有操作权限')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要为选中的 ${selectedIds.value.length} 笔订单开始归还复核吗？`,
      '批量操作确认',
      { type: 'warning' }
    )

    const results = equipmentStore.batchAction('batch_start_return', selectedIds.value)

    if (results.success.length > 0) {
      ElMessage.success(`成功为 ${results.success.length} 笔订单开始复核`)
    }
    if (results.failed.length > 0) {
      ElMessage.error(`${results.failed.length} 笔订单操作失败`)
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
.monospace {
  font-family: monospace;
  font-size: 12px;
}

.equipment-cell {
  line-height: 1.4;
}

.equipment-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
}

.equipment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.serial {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

.outbound-info {
  line-height: 1.4;
}

.outbound-info .inspector {
  font-weight: 500;
  color: #374151;
}

.outbound-info .time {
  font-size: 11px;
  color: #9ca3af;
}

.key-points-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.key-point-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  background: #dcfce7;
  color: #166534;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
}

.key-point-tag.abnormal {
  background: #fee2e2;
  color: #991b1b;
}

.no-key-points {
  font-size: 11px;
  color: #9ca3af;
}
</style>
