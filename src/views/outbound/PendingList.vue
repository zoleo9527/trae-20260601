<template>
  <div class="outbound-pending-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">待出库验机</h1>
        <p class="page-subtitle">共有 {{ pendingList.length }} 笔订单等待出库验机</p>
      </div>
      <div class="header-actions">
        <el-button :disabled="selectedIds.length === 0" @click="handleBatchStart">
          <el-icon><Select /></el-icon>
          批量开始验机 ({{ selectedIds.length }})
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
      <el-table-column prop="customer.name" label="客户" width="120" />
      <el-table-column label="租期" width="180">
        <template #default="{ row }">
          <div class="rental-period">
            <div class="days">{{ row.rentalPeriod.days }}天</div>
            <div class="time">{{ row.rentalPeriod.start }}</div>
          </div>
        </template>
      </el-table-column>
      <el-table-column label="押金/租金" width="160">
        <template #default="{ row }">
          <div class="amount-cell">
            <div>押金: <span class="amount">¥{{ row.deposit.toLocaleString() }}</span></div>
            <div>租金: <span class="amount">¥{{ row.totalAmount }}</span></div>
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
            v-if="row.status === 'pending_outbound'"
            type="primary"
            size="small"
            @click="startInspection(row.id)"
          >
            开始验机
          </el-button>
          <el-button
            v-else
            type="warning"
            size="small"
            @click="continueInspection(row.id)"
          >
            继续验机
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <div class="integration-point">
      <el-icon><InfoFilled /></el-icon>
      <strong>集成点：</strong>
      订单数据暂为模拟数据，真实环境需对接租赁订单系统。位置：<code>src/data/mockData.js - mockRentals</code>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { STATUS_FLOW, STATUS_LABELS } from '@/data/mockData'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const loading = ref(false)
const selectedIds = ref([])

const pendingList = computed(() => equipmentStore.pendingOutbound)

const canEdit = computed(() => authStore.hasPermission('outbound:inspect'))

const getStatusLabel = (status) => STATUS_LABELS[status]?.label || status
const getStatusType = (status) => STATUS_LABELS[status]?.type || 'info'

const handleSelectionChange = (selection) => {
  selectedIds.value = selection
    .filter(r => r.status === STATUS_FLOW.PENDING_OUTBOUND)
    .map(r => r.id)
}

const startInspection = (id) => {
  if (!canEdit.value) {
    ElMessage.warning('您没有操作权限，请切换到一线操作员角色')
    return
  }
  equipmentStore.startOutboundInspection(id)
  router.push(`/outbound/inspect/${id}`)
}

const continueInspection = (id) => {
  router.push(`/outbound/inspect/${id}`)
}

const handleBatchStart = async () => {
  if (!canEdit.value) {
    ElMessage.warning('您没有操作权限')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要为选中的 ${selectedIds.value.length} 笔订单开始验机吗？`,
      '批量操作确认',
      { type: 'warning' }
    )

    const results = equipmentStore.batchAction('batch_start_outbound', selectedIds.value)

    if (results.success.length > 0) {
      ElMessage.success(`成功为 ${results.success.length} 笔订单开始验机`)
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

.rental-period {
  line-height: 1.4;
}

.rental-period .days {
  font-weight: 600;
  color: #1f2937;
}

.rental-period .time {
  font-size: 12px;
  color: #6b7280;
}

.amount-cell {
  font-size: 12px;
  line-height: 1.6;
}

.amount {
  color: #059669;
  font-weight: 600;
}
</style>
