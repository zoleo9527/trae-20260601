<template>
  <div>
    <div 
      class="drawer-overlay" 
      :class="{ open: visible }"
      @click="handleClose"
    ></div>
    <div 
      class="drawer" 
      :class="{ open: visible }"
    >
      <div class="drawer-header">
        <div class="drawer-title">
          <span class="exception-badge">异常处理</span>
          {{ record?.id }}
        </div>
        <button class="drawer-close" @click="handleClose">×</button>
      </div>
      
      <div class="drawer-body">
        <div class="section">
          <h3>基本信息</h3>
          <div class="info-row">
            <span class="info-label">彩票号码</span>
            <span class="info-value">{{ record?.ticketNumber }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">奖级</span>
            <span class="info-value">{{ record?.prizeType }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">金额</span>
            <span class="info-value">{{ formatAmount(record?.prizeAmount || 0) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">门店</span>
            <span class="info-value">{{ record?.storeName }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">顾客</span>
            <span class="info-value">{{ record?.customerName }}（{{ record?.customerId }}）</span>
          </div>
        </div>

        <div class="section">
          <h3>异常信息</h3>
          <div class="exception-detail">
            <div class="exception-title">异常原因</div>
            <div class="exception-content">{{ record?.remark || '未说明' }}</div>
          </div>
        </div>

        <div class="section">
          <h3>状态变更历史</h3>
          <div class="timeline">
            <div v-for="(change, index) in record?.statusChanges" :key="index" class="timeline-item">
              <div class="timeline-time">{{ change.time }}</div>
              <div class="timeline-content">
                <span :class="['status-badge', `status-${change.status}`]">
                  {{ statusText(change.status) }}
                </span>
              </div>
              <div class="timeline-operator">{{ change.operator }}（{{ change.operatorRole }}）</div>
              <div v-if="change.remark" class="timeline-remark">{{ change.remark }}</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h3>处理操作</h3>
          <div class="form-group">
            <label>处理方式</label>
            <select v-model="resolveAction">
              <option value="processing">重新处理</option>
              <option value="completed">直接完成</option>
              <option value="pending">退回待处理</option>
            </select>
          </div>
          <div class="form-group">
            <label>处理备注</label>
            <textarea v-model="resolveRemark" placeholder="请输入处理备注"></textarea>
          </div>
          <div class="action-buttons">
            <button class="btn btn-danger" @click="handleReject">驳回申请</button>
            <button class="btn btn-primary" @click="handleResolve">确认处理</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { PrizeRecord, User } from '~/types'

const props = defineProps<{
  record: PrizeRecord | null
  visible: boolean
  user: User | null
}>()

const emit = defineEmits(['close', 'resolve'])

const resolveAction = ref('processing')
const resolveRemark = ref('')

watch(() => props.visible, (newVal) => {
  if (newVal) {
    resolveAction.value = 'processing'
    resolveRemark.value = ''
  }
})

const formatAmount = (amount: number) => {
  return `¥${amount.toLocaleString()}`
}

const statusText = (status: string) => {
  const map: Record<string, string> = {
    pending: '待处理',
    processing: '处理中',
    completed: '已完成',
    exception: '异常'
  }
  return map[status] || status
}

const handleClose = () => {
  emit('close')
}

const handleResolve = async () => {
  if (!props.record) return
  
  const response = await fetch('/api/prize', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: props.record.id,
      status: resolveAction.value,
      operator: props.user?.name || '',
      operatorRole: props.user?.role || '',
      remark: resolveRemark.value
    })
  })
  
  const result = await response.json()
  if (result.success) {
    emit('resolve')
  }
}

const handleReject = async () => {
  if (!props.record) return
  
  const response = await fetch('/api/prize', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      id: props.record.id,
      status: 'pending',
      operator: props.user?.name || '',
      operatorRole: props.user?.role || '',
      remark: `${resolveRemark.value || ''} [已驳回]`
    })
  })
  
  const result = await response.json()
  if (result.success) {
    emit('resolve')
  }
}
</script>

<style scoped>
.section {
  margin-bottom: 24px;
}

.section h3 {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-label {
  color: #666;
  font-size: 13px;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
}

.exception-detail {
  background-color: #fff2f0;
  border-radius: 8px;
  padding: 16px;
}

.exception-title {
  font-size: 13px;
  color: #ff4d4f;
  margin-bottom: 8px;
}

.exception-content {
  font-size: 14px;
  color: #333;
}

.exception-badge {
  display: inline-block;
  padding: 2px 8px;
  background-color: #ff4d4f;
  color: white;
  border-radius: 4px;
  font-size: 12px;
  margin-right: 8px;
}

.action-buttons {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.action-buttons .btn {
  flex: 1;
}
</style>
