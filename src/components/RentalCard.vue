<template>
  <el-card class="rental-card card-hover" shadow="hover">
    <div class="card-header">
      <div class="equipment-info">
        <div class="equipment-name">{{ rental.equipment.name }}</div>
        <div class="equipment-meta">
          <el-tag size="small" type="info">{{ rental.equipment.category }}</el-tag>
          <span class="serial-no">{{ rental.equipment.serialNo }}</span>
        </div>
      </div>
      <el-tag :type="statusInfo.type" effect="dark" size="small">
        {{ statusInfo.label }}
      </el-tag>
    </div>

    <el-divider class="card-divider" />

    <div class="card-body">
      <div class="info-row">
        <div class="info-item">
          <span class="label">订单号</span>
          <span class="value">{{ rental.orderNo }}</span>
        </div>
        <div class="info-item">
          <span class="label">客户</span>
          <span class="value">{{ rental.customer.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">租期</span>
          <span class="value">{{ rental.rentalPeriod.days }}天</span>
        </div>
      </div>

      <div class="info-row">
        <div class="info-item">
          <span class="label">押金</span>
          <span class="value amount">¥{{ rental.deposit.toLocaleString() }}</span>
        </div>
        <div class="info-item">
          <span class="label">日租</span>
          <span class="value amount">¥{{ rental.dailyRate }}/天</span>
        </div>
        <div class="info-item">
          <span class="label">总额</span>
          <span class="value amount">¥{{ rental.totalAmount }}</span>
        </div>
      </div>

      <div class="time-period">
        <el-icon><Clock /></el-icon>
        <span>{{ rental.rentalPeriod.start }} ~ {{ rental.rentalPeriod.end }}</span>
      </div>

      <div v-if="showKeyPoints && rental.outboundInspection" class="key-points-preview">
        <div class="key-points-title">
          <el-icon color="#f59e0b"><Star /></el-icon>
          出库关键判断
        </div>
        <div class="key-points-list">
          <div
            v-for="(point, index) in keyPoints"
            :key="index"
            class="key-point-item"
            :class="{ 'abnormal': point.result === 'abnormal' }"
          >
            <el-tag size="mini" :type="point.result === 'abnormal' ? 'danger' : 'success'">
              {{ point.result === 'abnormal' ? '异常' : '正常' }}
            </el-tag>
            <span class="key-point-text">{{ point.description }}</span>
          </div>
        </div>
      </div>

      <div v-if="rental.returnInspection?.overallResult === 'abnormal'" class="anomaly-badge">
        <el-icon color="#ef4444"><Warning /></el-icon>
        <span>归还异常待处理</span>
      </div>
    </div>

    <div class="card-actions">
      <slot name="actions" :rental="rental"></slot>
    </div>
  </el-card>
</template>

<script setup>
import { computed } from 'vue'
import { useEquipmentStore } from '@/stores/equipment'
import { INSPECTION_ITEMS } from '@/data/mockData'

const props = defineProps({
  rental: {
    type: Object,
    required: true
  },
  showKeyPoints: {
    type: Boolean,
    default: false
  }
})

const equipmentStore = useEquipmentStore()

const statusInfo = computed(() => equipmentStore.getStatusInfo(props.rental.status))

const keyPoints = computed(() => {
  if (!props.rental.outboundInspection) return []
  return equipmentStore.getOutboundKeyPoints(props.rental)
    .map(p => ({
      ...p,
      label: INSPECTION_ITEMS.find(i => i.key === p.key)?.label || p.key
    }))
})
</script>

<style scoped>
.rental-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.equipment-name {
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 6px;
}

.equipment-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.serial-no {
  font-size: 12px;
  color: #9ca3af;
  font-family: monospace;
}

.card-divider {
  margin: 12px 0;
}

.card-body {
  flex: 1;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-item .label {
  font-size: 11px;
  color: #9ca3af;
}

.info-item .value {
  font-size: 13px;
  color: #374151;
  font-weight: 500;
}

.info-item .value.amount {
  color: #059669;
  font-weight: 600;
}

.time-period {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 12px;
  color: #6b7280;
  margin: 12px 0;
}

.time-period .el-icon {
  color: #60a5fa;
}

.key-points-preview {
  background: linear-gradient(90deg, #fef3c7 0%, transparent 100%);
  border-left: 3px solid #f59e0b;
  padding: 10px 12px;
  border-radius: 4px;
  margin-top: 12px;
}

.key-points-title {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #92400e;
  margin-bottom: 8px;
}

.key-points-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.key-point-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #78350f;
}

.key-point-item.abnormal {
  color: #b91c1c;
}

.key-point-text {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.anomaly-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #fef2f2;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #b91c1c;
  margin-top: 12px;
}

.card-actions {
  display: flex;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
  margin-top: 12px;
}
</style>
