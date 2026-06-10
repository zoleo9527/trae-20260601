<script setup lang="ts">
import { computed, ref } from 'vue'
import { useStore } from '../store'
import { FEED_STATUS_LABELS, ANALYSIS_STATUS_LABELS, REVIEW_STATUS_LABELS, REVIEW_TYPE_LABELS } from '../types'
import type { FarmRecord } from '../types'

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

function totalAttachmentCount(rec: FarmRecord) {
  return rec.feed.attachments.length + rec.reviews.reduce((sum, r) => sum + r.attachments.length, 0)
}

function reviewSummary(rec: FarmRecord) {
  const parts: { label: string; status: string }[] = []
  const feedReview = rec.reviews.find(r => r.reviewType === 'feed_deviation')
  const consumptionReview = rec.reviews.find(r => r.reviewType === 'consumption_issue')

  const hasFeedRisk = rec.feed.riskFlag
  const hasConsumptionIssue = rec.analysis?.status === 'issue'

  if (hasFeedRisk || feedReview) {
    if (feedReview && feedReview.status !== 'pending') {
      parts.push({ label: '投喂', status: feedReview.status })
    } else {
      parts.push({ label: '投喂', status: 'pending' })
    }
  }

  if (hasConsumptionIssue || consumptionReview) {
    if (consumptionReview && consumptionReview.status !== 'pending') {
      parts.push({ label: '耗用', status: consumptionReview.status })
    } else {
      parts.push({ label: '耗用', status: 'pending' })
    }
  }

  return parts
}

function reviewSummaryClass(status: string) {
  return `review-${status}`
}

function hasAnyPendingReview(rec: FarmRecord) {
  return reviewSummary(rec).some(p => p.status === 'pending')
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
        <span class="col-feed-status">投喂</span>
        <span class="col-analysis">耗用</span>
        <span class="col-variance">偏差</span>
        <span class="col-review">场长处理</span>
        <span class="col-attach">📎</span>
        <span class="col-judgment">关键判断</span>
      </div>

      <div
        v-for="rec in filteredRecords"
        :key="rec.feed.id"
        class="list-row"
        :class="{
          'row-risk': hasAnyPendingReview(rec),
          'row-pending': rec.feed.status === 'pending',
          'row-resolved': rec.reviews.length > 0 && rec.reviews.every(r => r.status !== 'pending' && r.decision === 'approved') && !rec.feed.riskFlag
        }"
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
          <span v-else class="status-tag analysis-none">-</span>
        </span>
        <span class="col-variance">
          <template v-if="rec.analysis && rec.analysis.varianceRate !== null">
            <span :class="varianceDisplay(rec.analysis.varianceRate).cls">
              {{ varianceDisplay(rec.analysis.varianceRate).text }}
            </span>
          </template>
          <template v-else>-</template>
        </span>
        <span class="col-review">
          <template v-if="reviewSummary(rec).length">
            <span
              v-for="(part, idx) in reviewSummary(rec)"
              :key="idx"
              :class="['status-tag', 'review-tag', reviewSummaryClass(part.status)]"
            >
              {{ part.label }}:{{ REVIEW_STATUS_LABELS[part.status as keyof typeof REVIEW_STATUS_LABELS] }}
            </span>
          </template>
          <span v-else class="status-tag review-none">-</span>
        </span>
        <span class="col-attach">
          <span v-if="totalAttachmentCount(rec) > 0" class="attach-indicator">
            📎{{ totalAttachmentCount(rec) }}
          </span>
          <span v-else>-</span>
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
  grid-template-columns: 60px 60px 80px 105px 60px 60px 55px 100px 40px 1fr;
  gap: 5px;
  padding: 10px 14px;
  font-size: 11px;
  font-weight: 600;
  color: #999;
  letter-spacing: 0.5px;
  border-bottom: 1px solid #eee;
  background: #fafbfc;
}

.list-row {
  display: grid;
  grid-template-columns: 60px 60px 80px 105px 60px 60px 55px 100px 40px 1fr;
  gap: 5px;
  padding: 12px 14px;
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

.row-resolved {
  border-left: 3px solid #27ae60;
}

.row-risk:hover {
  background: #fdf5f5;
}

.status-tag {
  display: inline-block;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 3px;
  font-weight: 600;
  white-space: nowrap;
}

.review-tag {
  margin-right: 2px;
}

.status-pending { background: #fef3e2; color: #e67e22; }
.status-delivered { background: #e8f8f0; color: #27ae60; }
.status-abnormal { background: #fde8e8; color: #e74c3c; }
.analysis-done { background: #e8f8f0; color: #27ae60; }
.analysis-pending { background: #fef3e2; color: #e67e22; }
.analysis-issue { background: #fde8e8; color: #e74c3c; }
.analysis-none { background: #f0f0f0; color: #999; }
.review-approved { background: #e8f8f0; color: #27ae60; }
.review-rejected { background: #fde8e8; color: #e74c3c; }
.review-followup { background: #fef3e2; color: #e67e22; }
.review-pending { background: #fef3e2; color: #e67e22; }
.review-none { background: #f0f0f0; color: #aaa; }

.variance-ok { color: #27ae60; font-weight: 600; font-size: 12px; }
.variance-warn { color: #e74c3c; font-weight: 700; font-size: 12px; }

.attach-indicator { font-size: 11px; color: #2980b9; font-weight: 600; }

.judgment-text {
  font-size: 11px; color: #555;
  display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden;
}

.no-judgment { color: #ccc; }
</style>
