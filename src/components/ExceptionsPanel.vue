<template>
  <div class="exceptions-panel">
    <div class="panel-header">
      <h2>异常处理</h2>
      <div class="exception-count">
        共 {{ records.length }} 条异常记录
      </div>
    </div>

    <div class="card">
      <table class="table">
        <thead>
          <tr>
            <th>兑奖编号</th>
            <th>彩票号码</th>
            <th>奖级</th>
            <th>金额</th>
            <th>门店</th>
            <th>顾客</th>
            <th>当前环节</th>
            <th>当前处理人</th>
            <th>异常时间</th>
            <th>异常原因</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="record in records" :key="record.id">
            <td>{{ record.id }}</td>
            <td>{{ record.ticketNumber }}</td>
            <td>{{ record.prizeType }}</td>
            <td>{{ formatAmount(record.prizeAmount) }}</td>
            <td>{{ record.storeName }}</td>
            <td>{{ record.customerName }}</td>
            <td>
              <span :class="['stage-badge', `stage-${record.currentStage}`]">
                {{ stageText(record.currentStage) }}
              </span>
            </td>
            <td>{{ record.currentHandlerName }}（{{ record.currentHandler }}）</td>
            <td>{{ record.lastUpdatedAt }}</td>
            <td>
              <span class="exception-reason">{{ record.remark || '无备注' }}</span>
            </td>
            <td>
              <button class="btn btn-sm btn-danger" @click="handleException(record)">处理异常</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div v-if="records.length === 0" class="empty-state">
        <div class="empty-icon">✓</div>
        <div class="empty-text">暂无异常记录</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PrizeRecord, User, ProcessStage } from '~/types'
import { stageLabels } from '~/types'

defineProps<{
  records: PrizeRecord[]
  user: User | null
}>()

const emit = defineEmits(['handle'])

const formatAmount = (amount: number) => {
  return `¥${amount.toLocaleString()}`
}

const stageText = (stage: string) => {
  return stageLabels[stage as ProcessStage] || stage
}

const handleException = (record: PrizeRecord) => {
  emit('handle', record)
}
</script>

<style scoped>
.exceptions-panel {
  width: 100%;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.panel-header h2 {
  font-size: 18px;
  color: #333;
}

.exception-count {
  padding: 4px 12px;
  background-color: #fff2f0;
  color: #ff4d4f;
  border-radius: 4px;
  font-size: 14px;
}

.exception-reason {
  color: #ff4d4f;
  font-size: 13px;
  max-width: 150px;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.empty-state {
  text-align: center;
  padding: 40px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  margin: 0 auto 16px;
  background-color: #f6ffed;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #52c41a;
}

.empty-text {
  color: #999;
  font-size: 14px;
}

.stage-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.stage-registration {
  background-color: #e6f7ff;
  color: #1890ff;
}

.stage-verification {
  background-color: #fff7e6;
  color: #d48806;
}

.stage-payment {
  background-color: #f6ffed;
  color: #52c41a;
}

.stage-completed {
  background-color: #f0f0f0;
  color: #666;
}

.stage-exception {
  background-color: #fff2f0;
  color: #ff4d4f;
}
</style>
