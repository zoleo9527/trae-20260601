<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import dayjs from 'dayjs'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const store = useDataStore()

const searchKeyword = ref('')
const statusFilter = ref('all')

const filteredReviews = computed(() => {
  let list = store.reviews
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(r => r.registrationNo.toLowerCase().includes(kw))
  }
  if (statusFilter.value !== 'all') {
    list = list.filter(r => r.status === statusFilter.value)
  }
  return list
})

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'pending', label: '待复核' },
  { value: 'confirmed', label: '已确认' },
  { value: 'rejected', label: '已驳回' },
  { value: 'disputed', label: '有争议' }
]

function getInbound(reviewId: string) {
  const review = store.reviews.find(r => r.id === reviewId)
  if (!review) return null
  return store.getInboundById(review.inboundId)
}

function goDetail(id: string) {
  const review = store.reviews.find(r => r.id === id)
  if (review) {
    const inbound = store.getInboundById(review.inboundId)
    store.addRecentItem({
      id: review.id,
      type: 'review',
      title: review.registrationNo,
      subtitle: `${inbound?.supplierName || ''} - ${inbound?.mainCategoryName || ''}`,
      status: review.status,
      visitedAt: dayjs().toISOString()
    })
  }
  router.push(`/review/${id}`)
}
</script>

<template>
  <div class="review-list">
    <div class="list-header">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索登记单号..."
        />
      </div>
      <div class="header-right">
        <select v-model="statusFilter" class="form-select status-select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="list-card">
      <table class="table">
        <thead>
          <tr>
            <th>登记单号</th>
            <th>供应商</th>
            <th>主品类</th>
            <th>混装</th>
            <th>净重对比</th>
            <th>状态</th>
            <th>提交人</th>
            <th>提交时间</th>
            <th>复核人</th>
            <th>复核时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="review in filteredReviews" :key="review.id" class="table-row">
            <td class="no-cell">{{ review.registrationNo }}</td>
            <td>{{ getInbound(review.id)?.supplierName || '-' }}</td>
            <td>{{ getInbound(review.id)?.mainCategoryName || '-' }}</td>
            <td>
              <span v-if="review.confirmedMixedItems.length > 0" class="badge badge-warning">
                {{ review.confirmedMixedItems.length }}种
              </span>
              <span v-else class="badge">否</span>
            </td>
            <td class="weight-cell">
              <div class="weight-compare">
                <span class="weight-orig">{{ getInbound(review.id)?.netWeight?.toLocaleString() || '-' }}</span>
                <span class="weight-arrow">→</span>
                <span
                  :class="[
                    'weight-confirmed',
                    review.confirmedNetWeight !== (getInbound(review.id)?.netWeight || 0) && review.confirmedNetWeight < (getInbound(review.id)?.netWeight || 0) ? 'text-error' : '',
                    review.confirmedNetWeight !== (getInbound(review.id)?.netWeight || 0) && review.confirmedNetWeight > (getInbound(review.id)?.netWeight || 0) ? 'text-success' : ''
                  ]"
                >
                  {{ review.confirmedNetWeight.toLocaleString() }}
                </span>
              </div>
            </td>
            <td>
              <StatusBadge :status="review.status" />
            </td>
            <td class="handover-cell">
              <span class="handover-name">{{ getInbound(review.id)?.submittedBy || '-' }}</span>
              <span class="handover-role">过磅员</span>
            </td>
            <td class="time-cell">
              {{ getInbound(review.id)?.submittedAt ? dayjs(getInbound(review.id)?.submittedAt).format('MM-DD HH:mm') : '-' }}
            </td>
            <td class="handover-cell">
              <template v-if="review.reviewer">
                <span class="handover-name">{{ review.reviewer }}</span>
                <span class="handover-role">分拣班长</span>
              </template>
              <span v-else class="text-tertiary">-</span>
            </td>
            <td class="time-cell">
              {{ review.reviewedAt ? dayjs(review.reviewedAt).format('MM-DD HH:mm') : '-' }}
            </td>
            <td>
              <button class="btn btn-sm" @click="goDetail(review.id)">
                {{ review.status === 'pending' ? '复核' : '查看' }}
              </button>
            </td>
          </tr>
          <tr v-if="filteredReviews.length === 0">
            <td colspan="11" class="empty-cell">
              <div class="empty-content">
                <div class="empty-icon">⚖️</div>
                <div class="empty-text">暂无过磅复核记录</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.review-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.search-box {
  flex: 1;
  max-width: 400px;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 14px;
  color: var(--text-tertiary);
}

.search-input {
  width: 100%;
  padding: 8px 12px 8px 36px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  outline: none;
  background: #fff;
  font-size: 14px;
  transition: border-color 0.2s;
}

.search-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-select {
  width: 140px;
}

.list-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.table-row {
  cursor: pointer;
}

.no-cell {
  font-family: 'SF Mono', Monaco, monospace;
  font-weight: 500;
  color: var(--primary-color);
}

.weight-cell {
  font-family: 'SF Mono', Monaco, monospace;
  font-weight: 500;
}

.time-cell {
  color: var(--text-secondary);
  font-size: 13px;
}

.empty-cell {
  padding: 60px 20px !important;
  text-align: center;
}

.empty-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.empty-icon {
  font-size: 48px;
  opacity: 0.5;
}

.empty-text {
  color: var(--text-tertiary);
  font-size: 14px;
}

.weight-compare {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'SF Mono', Monaco, monospace;
}

.weight-orig {
  color: var(--text-secondary);
  font-size: 12px;
}

.weight-arrow {
  color: var(--text-tertiary);
  font-size: 11px;
}

.weight-confirmed {
  font-weight: 600;
  font-size: 13px;
}

.handover-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.handover-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.handover-role {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-secondary);
  padding: 1px 6px;
  border-radius: 3px;
  width: fit-content;
}
</style>
