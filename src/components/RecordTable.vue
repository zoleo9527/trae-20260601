<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../store'
import { FEED_STATUS_LABELS, ANALYSIS_STATUS_LABELS } from '../types'

const emit = defineEmits<{
  'select-record': [id: string]
}>()

const { state } = useStore()

const dateFilter = ref<'all' | 'today' | 'yesterday'>('all')
const statusFilter = ref<'all' | 'pending' | 'delivered' | 'abnormal'>('all')

const today = new Date().toISOString().slice(0, 10)
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

const filteredRecords = computed(() => {
  let records = state.farmRecords

  if (dateFilter.value === 'today') {
    records = records.filter(r => r.feed.date === today)
  } else if (dateFilter.value === 'yesterday') {
    records = records.filter(r => r.feed.date === yesterday)
  }

  if (statusFilter.value !== 'all') {
    records = records.filter(r => r.feed.status === statusFilter.value)
  }

  return records.sort((a, b) => {
    if (a.feed.riskFlag !== b.feed.riskFlag) return a.feed.riskFlag ? -1 : 1
    if (a.feed.status === 'pending' && b.feed.status !== 'pending') return -1
    return b.feed.updatedAt.localeCompare(a.feed.updatedAt)
  })
})

function feedStatusClass(status: string) {
  return `status-${status}`
}

function analysisStatusClass(status: string) {
  return `analysis-${status}`
}

function varianceDisplay(rate: number | null) {
  if (rate === null) return '-'
  const sign = rate > 0 ? '+' : ''
  const cls = Math.abs(rate) > 3 ? 'variance-warn' : 'variance-ok'
  return { text: `${sign}${rate}%`, cls }
}
</script>

<template>
  <div class="record-table-wrapper">
    <div class="table-toolbar">
      <div class="filter-group">
        <button
          v-for="f in (['all', 'today', 'yesterday'] as const)"
          :key="f"
          :class="['filter-btn', { active: dateFilter === f }]"
          @click="dateFilter = f"
        >
          {{ f === 'all' ? '全部日期' : f === 'today' ? '今日' : '昨日' }}
        </button>
      </div>
      <div class="filter-group">
        <button
          v-for="f in (['all', 'pending', 'delivered', 'abnormal'] as const)"
          :key="f"
          :class="['filter-btn', { active: statusFilter === f }]"
          @click="statusFilter = f"
        >
          {{ f === 'all' ? '全部状态' : FEED_STATUS_LABELS[f] }}
        </button>
      </div>
    </div>

    <div class="record-list">
      <div class="list-header">
        <span class="col-house">鸡舍</span>
        <span class="col-date">日期</span>
        <span class="col-type">饲料</span>
        <span class="col-plan">计划/实际</span>
        <span class="col-feed-status">投喂状态</span>
        <span class="col-analysis">耗用分析</span>
        <span class="col-variance">偏差</span>
        <span class="col-risk">风险</span>
        <span class="col-judgment">关键判断</span>
      </div>

      <div
        v-for="rec in filteredRecords"
        :key="rec.feed.id"
        class="list-row"
        :class="{ 'row-risk': rec.feed.riskFlag, 'row-pending': rec.feed.status === 'pending' }"
        @click="emit('select-record', rec.feed.id)"
      >
        <span class="col-house">
          <strong>{{ rec.feed.houseName }}</strong>
        </span>
        <span class="col-date">{{ rec.feed.date.slice(5) }}</span>
        <span class="col-type">{{ rec.feed.feedType }}</span>
        <span class="col-plan">
          {{ rec.feed.plannedAmount }}kg
          <template v-if="rec.feed.actualAmount !== null">
            / {{ rec.feed.actualAmount }}kg
          </template>
        </span>
        <span class="col-feed-status">
          <span :class="['status-tag', feedStatusClass(rec.feed.status)]">
            {{ FEED_STATUS_LABELS[rec.feed.status] }}
          </span>
        </span>
        <span class="col-analysis">
          <span v-if="rec.analysis" :class="['status-tag', analysisStatusClass(rec.analysis.status)]">
            {{ ANALYSIS_STATUS_LABELS[rec.analysis.status] }}
          </span>
          <span v-else class="status-tag analysis-none">未关联</span>
        </span>
        <span class="col-variance">
          <template v-if="rec.analysis && rec.analysis.varianceRate !== null">
            <span :class="varianceDisplay(rec.analysis.varianceRate).cls">
              {{ varianceDisplay(rec.analysis.varianceRate).text }}
            </span>
          </template>
          <template v-else>-</template>
        </span>
        <span class="col-risk">
          <span v-if="rec.feed.riskFlag" class="risk-flag">⚠ 风险</span>
        </span>
        <span class="col-judgment">
          <span v-if="rec.feed.keyJudgment" class="judgment-text">{{ rec.feed.keyJudgment }}</span>
          <span v-else class="no-judgment">-</span>
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.record-table-wrapper {
  background: #fff;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  padding: 12px 18px;
  border-bottom: 1px solid #f0f0f0;
  background: #fafbfc;
}

.filter-group {
  display: flex;
  gap: 4px;
}

.filter-btn {
  padding: 4px 12px;
  font-size: 12px;
  border: 1px solid #ddd;
  background: #fff;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}

.filter-btn:hover {
  border-color: #bbb;
}

.filter-btn.active {
  background: #1a1a2e;
  color: #fff;
  border-color: #1a1a2e;
}

.record-list {
  overflow-x: auto;
}

.list-header {
  display: grid;
  grid-template-columns: 70px 70px 90px 120px 80px 80px 70px 60px 1fr;
  gap: 8px;
  padding: 10px 18px;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #eee;
  background: #fafbfc;
}

.list-row {
  display: grid;
  grid-template-columns: 70px 70px 90px 120px 80px 80px 70px 60px 1fr;
  gap: 8px;
  padding: 12px 18px;
  font-size: 13px;
  border-bottom: 1px solid #f5f5f5;
  cursor: pointer;
  transition: background 0.15s;
  align-items: center;
}

.list-row:hover {
  background: #f8f9fb;
}

.list-row:last-child {
  border-bottom: none;
}

.row-risk {
  background: #fef9f9;
  border-left: 3px solid #e74c3c;
}

.row-pending {
  background: #fefcf5;
  border-left: 3px solid #f39c12;
}

.row-risk:hover {
  background: #fdf5f5;
}

.status-tag {
  display: inline-block;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 3px;
  font-weight: 600;
}

.status-pending {
  background: #fef3e2;
  color: #e67e22;
}

.status-delivered {
  background: #e8f8f0;
  color: #27ae60;
}

.status-abnormal {
  background: #fde8e8;
  color: #e74c3c;
}

.analysis-done {
  background: #e8f8f0;
  color: #27ae60;
}

.analysis-pending {
  background: #fef3e2;
  color: #e67e22;
}

.analysis-issue {
  background: #fde8e8;
  color: #e74c3c;
}

.analysis-none {
  background: #f0f0f0;
  color: #999;
}

.variance-ok {
  color: #27ae60;
  font-weight: 600;
}

.variance-warn {
  color: #e74c3c;
  font-weight: 700;
}

.risk-flag {
  font-size: 12px;
  color: #e74c3c;
  font-weight: 700;
}

.judgment-text {
  font-size: 12px;
  color: #555;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.no-judgment {
  color: #ccc;
}
</style>
