<template>
  <div class="return-completed-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">已复核记录</h1>
        <p class="page-subtitle">已完成归还复核的订单记录</p>
      </div>
      <div class="header-actions">
        <el-button @click="exportData" :disabled="!canExport">
          <el-icon><Download /></el-icon>
          导出记录
        </el-button>
      </div>
    </div>

    <el-table :data="completedList" v-loading="loading" style="width: 100%">
      <el-table-column prop="orderNo" label="订单号" width="160" fixed="left">
        <template #default="{ row }">
          <span class="monospace">{{ row.orderNo }}</span>
        </template>
      </el-table-column>
      <el-table-column label="器材信息" min-width="220">
        <template #default="{ row }">
          <div class="equipment-cell">
            <div class="equipment-name">{{ row.equipment.name }}</div>
            <div class="equipment-meta">
              <span class="serial">{{ row.equipment.serialNo }}</span>
            </div>
          </div>
        </template>
      </el-table-column>
      <el-table-column prop="customer.name" label="客户" width="100" />
      <el-table-column label="复核员" width="100">
        <template #default="{ row }">
          {{ row.returnInspection?.inspector || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="复核时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.returnInspection?.inspectedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="复核结果" width="100">
        <template #default="{ row }">
          <el-tag :type="row.returnInspection?.overallResult === 'abnormal' ? 'danger' : 'success'">
            {{ row.returnInspection?.overallResult === 'abnormal' ? '异常' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="异常情况" min-width="180">
        <template #default="{ row }">
          <div v-if="row.returnInspection?.anomalyReport" class="anomaly-info">
            <el-tag size="small" type="danger">
              预估费用 ¥{{ row.returnInspection.anomalyReport.estimatedCost }}
            </el-tag>
            <p class="anomaly-desc">
              {{ row.returnInspection.anomalyReport.pendingAction }}
            </p>
          </div>
          <span v-else style="color: #9ca3af;">无异常</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="当前状态" width="130">
        <template #default="{ row }">
          <el-tag :type="getStatusType(row.status)">
            {{ getStatusLabel(row.status) }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" size="small" text @click="viewDetail(row.id)">
            查看详情
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'
import { STATUS_LABELS } from '@/data/mockData'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const loading = ref(false)

const completedList = computed(() => equipmentStore.completedReturn)
const canExport = computed(() => authStore.hasPermission('history:export'))

const getStatusLabel = (status) => STATUS_LABELS[status]?.label || status
const getStatusType = (status) => STATUS_LABELS[status]?.type || 'info'

const formatTime = (timestamp) => {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

const viewDetail = (id) => {
  router.push(`/history/detail/${id}`)
}

const exportData = () => {
  if (!canExport.value) {
    ElMessage.warning('您没有导出权限')
    return
  }
  ElMessage.info('导出功能待实现')
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

.serial {
  font-size: 11px;
  color: #9ca3af;
  font-family: monospace;
}

.anomaly-info {
  line-height: 1.5;
}

.anomaly-desc {
  font-size: 11px;
  color: #6b7280;
  margin: 4px 0 0 0;
}
</style>
