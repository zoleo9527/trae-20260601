<template>
  <div class="outbound-completed-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">已出库记录</h1>
        <p class="page-subtitle">已完成出库验机的订单记录</p>
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
      <el-table-column label="验机员" width="100">
        <template #default="{ row }">
          {{ row.outboundInspection?.inspector || '-' }}
        </template>
      </el-table-column>
      <el-table-column label="验机时间" width="160">
        <template #default="{ row }">
          {{ formatTime(row.outboundInspection?.inspectedAt) }}
        </template>
      </el-table-column>
      <el-table-column label="验机结果" width="100">
        <template #default="{ row }">
          <el-tag :type="row.outboundInspection?.overallResult === 'abnormal' ? 'warning' : 'success'">
            {{ row.outboundInspection?.overallResult === 'abnormal' ? '有备注' : '正常' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="当前状态" width="120">
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

    <div class="integration-point">
      <el-icon><InfoFilled /></el-icon>
      <strong>集成点：</strong>
      导出功能暂未实现，需对接报表系统。位置：<code>src/views/outbound/CompletedList.vue</code>
    </div>
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

const completedList = computed(() => equipmentStore.completedOutbound)
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
  ElMessage.info('导出功能待实现，需对接报表系统')
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
</style>
