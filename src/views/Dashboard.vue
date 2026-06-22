<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import dayjs from 'dayjs'
import StatusBadge from '@/components/StatusBadge.vue'

const router = useRouter()
const store = useDataStore()

const stats = computed(() => {
  const today = dayjs().format('YYYY-MM-DD')
  const todayInbounds = store.inbounds.filter(i => dayjs(i.createdAt).format('YYYY-MM-DD') === today)
  const todayConfirmed = store.inbounds.filter(
    i => i.status === 'confirmed' && dayjs(i.updatedAt).format('YYYY-MM-DD') === today
  )
  const totalWeight = todayConfirmed.reduce((sum, i) => sum + i.netWeight, 0)
  const pendingCount = store.inbounds.filter(i => i.status === 'submitted' || i.status === 'reviewing').length
  const disputeCount = store.disputes.filter(d => d.status === 'pending').length
  const mixedCount = store.inbounds.filter(i => i.isMixed && i.status !== 'draft').length

  return {
    todayTotal: todayInbounds.length,
    todayConfirmed: todayConfirmed.length,
    todayWeight: totalWeight,
    pendingCount,
    disputeCount,
    mixedCount
  }
})

const recentActivities = computed(() => store.getRecentLogs(undefined, undefined, 15))

function goInbound(id: string) {
  router.push(`/inbound/${id}`)
}

function goReview(id: string) {
  const review = store.reviews.find(r => r.inboundId === id)
  if (review) {
    router.push(`/review/${review.id}`)
  }
}

function getActionIcon(action: string) {
  if (action.includes('创建')) return '➕'
  if (action.includes('提交')) return '📤'
  if (action.includes('确认') || action.includes('复核')) return '✅'
  if (action.includes('驳回')) return '❌'
  if (action.includes('争议')) return '⚠️'
  if (action.includes('更新')) return '✏️'
  if (action.includes('价格')) return '💰'
  return '📝'
}
</script>

<template>
  <div class="dashboard">
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon stat-icon-blue">📋</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayTotal }}</div>
          <div class="stat-label">今日进厂登记</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-green">✅</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayConfirmed }}</div>
          <div class="stat-label">今日已确认</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon stat-icon-orange">⚖️</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.todayWeight.toLocaleString() }}<span class="stat-unit">kg</span></div>
          <div class="stat-label">今日确认重量</div>
        </div>
      </div>
      <div class="stat-card stat-warning">
        <div class="stat-icon stat-icon-yellow">⏳</div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.pendingCount }}</div>
          <div class="stat-label">待处理复核</div>
        </div>
      </div>
    </div>

    <div class="main-grid">
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">🔔 需要处理</h3>
          <span class="panel-subtitle">按优先级排列</span>
        </div>
        <div class="panel-body">
          <div class="section-title warning">
            <span class="dot warning-dot"></span>
            有争议的单子 ({{ stats.disputeCount }})
          </div>
          <div v-if="store.disputes.filter(d => d.status === 'pending').length === 0" class="empty-tip">
            暂无争议
          </div>
          <div
            v-for="dispute in store.disputes.filter(d => d.status === 'pending').slice(0, 3)"
            :key="dispute.id"
            class="todo-item dispute-item"
            @click="goInbound(dispute.inboundId)"
          >
            <div class="todo-icon">⚠️</div>
            <div class="todo-content">
              <div class="todo-title">
                重量争议 - {{ store.getInboundById(dispute.inboundId)?.registrationNo || '' }}
              </div>
              <div class="todo-desc">
                差异 <span class="text-error">{{ dispute.difference > 0 ? '+' : '' }}{{ dispute.difference }}kg</span>
                · {{ dispute.reason }}
              </div>
            </div>
            <StatusBadge status="disputed" size="sm" />
          </div>

          <div class="section-title">
            <span class="dot pending-dot"></span>
            待过磅复核 ({{ store.reviews.filter(r => r.status === 'pending').length }})
          </div>
          <div v-if="store.reviews.filter(r => r.status === 'pending').length === 0" class="empty-tip">
            暂无待复核单子
          </div>
          <div
            v-for="review in store.reviews.filter(r => r.status === 'pending').slice(0, 5)"
            :key="review.id"
            class="todo-item"
            @click="goReview(review.id)"
          >
            <div class="todo-icon">⚖️</div>
            <div class="todo-content">
              <div class="todo-title">{{ review.registrationNo }}</div>
              <div class="todo-desc">
                {{ store.getInboundById(review.inboundId)?.supplierName || '' }}
                · {{ review.confirmedNetWeight }}kg
              </div>
            </div>
            <StatusBadge status="pending" size="sm" />
          </div>

          <div class="section-title">
            <span class="dot mixed-dot"></span>
            混装待分拣 ({{ stats.mixedCount }})
          </div>
          <div v-if="store.inbounds.filter(i => i.isMixed && i.status === 'confirmed').length === 0" class="empty-tip">
            暂无混装单
          </div>
          <div
            v-for="inbound in store.inbounds.filter(i => i.isMixed && i.status !== 'draft').slice(0, 3)"
            :key="inbound.id"
            class="todo-item"
            @click="goInbound(inbound.id)"
          >
            <div class="todo-icon">📦</div>
            <div class="todo-content">
              <div class="todo-title">{{ inbound.registrationNo }} · {{ inbound.mainCategoryName }}</div>
              <div class="todo-desc">
                {{ inbound.mixedItems.length }} 种品类混装
                · 共 {{ inbound.netWeight }}kg
              </div>
            </div>
            <StatusBadge :status="inbound.status" size="sm" />
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">📜 最近动态</h3>
          <span class="panel-subtitle">实时更新</span>
        </div>
        <div class="panel-body activity-list">
          <div v-if="recentActivities.length === 0" class="empty-tip">
            暂无操作记录
          </div>
          <div v-for="log in recentActivities" :key="log.id" class="activity-item">
            <div class="activity-icon">{{ getActionIcon(log.action) }}</div>
            <div class="activity-content">
              <div class="activity-text">
                <span class="activity-operator">{{ log.operator }}</span>
                <span class="activity-role">({{ log.operatorRole }})</span>
                <span>{{ log.action }}</span>
              </div>
              <div class="activity-detail">{{ log.detail }}</div>
              <div class="activity-time">{{ dayjs(log.timestamp).format('HH:mm:ss') }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="bottom-grid">
      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">🕐 最近打开</h3>
          <button class="btn btn-sm" @click="router.push('/recent')">查看全部</button>
        </div>
        <div class="panel-body">
          <div v-if="store.recentItems.length === 0" class="empty-tip">
            暂无最近访问记录
          </div>
          <div
            v-for="item in store.recentItems.slice(0, 5)"
            :key="item.id + item.type"
            class="recent-item"
            @click="item.type === 'inbound' ? goInbound(item.id) : goReview(item.id)"
          >
            <div class="recent-icon">{{ item.type === 'inbound' ? '📋' : '⚖️' }}</div>
            <div class="recent-content">
              <div class="recent-title">{{ item.title }}</div>
              <div class="recent-subtitle">{{ item.subtitle }}</div>
            </div>
            <div class="recent-time">{{ dayjs(item.visitedAt).format('HH:mm') }}</div>
          </div>
        </div>
      </div>

      <div class="panel">
        <div class="panel-header">
          <h3 class="panel-title">💰 价格变动提醒</h3>
          <span class="panel-badge">重点关注</span>
        </div>
        <div class="panel-body">
          <div v-if="store.priceChanges.length === 0" class="empty-tip">
            暂无价格变动
          </div>
          <div v-for="pc in store.priceChanges.slice(0, 5)" :key="pc.id" class="price-item">
            <div class="price-name">{{ pc.categoryName }}</div>
            <div class="price-change">
              <span class="old-price">¥{{ pc.oldPrice }}</span>
              <span class="price-arrow">→</span>
              <span :class="['new-price', pc.newPrice > pc.oldPrice ? 'price-up' : 'price-down']">
                ¥{{ pc.newPrice }}
              </span>
            </div>
            <div class="price-time">{{ dayjs(pc.changedAt).format('MM-DD') }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--border-light);
  transition: all 0.2s;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.stat-card.stat-warning {
  border-color: #ffe58f;
  background: #fffbe6;
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-icon-blue { background: #e6f7ff; }
.stat-icon-green { background: #f6ffed; }
.stat-icon-orange { background: #fff7e6; }
.stat-icon-yellow { background: #fffbe6; }

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.2;
}

.stat-unit {
  font-size: 13px;
  font-weight: 400;
  color: var(--text-secondary);
  margin-left: 2px;
}

.stat-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-top: 4px;
}

.main-grid {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 20px;
}

.bottom-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.panel {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}

.panel-subtitle {
  font-size: 12px;
  color: var(--text-tertiary);
}

.panel-badge {
  background: #fff2f0;
  color: #ff4d4f;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.panel-body {
  padding: 12px 20px;
  max-height: 380px;
  overflow-y: auto;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  padding: 12px 0 8px;
  position: sticky;
  top: 0;
  background: #fff;
  z-index: 1;
}

.section-title.warning {
  color: var(--error-color);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.warning-dot { background: #ff4d4f; }
.pending-dot { background: #faad14; }
.mixed-dot { background: #1890ff; }

.empty-tip {
  text-align: center;
  padding: 24px;
  color: var(--text-tertiary);
  font-size: 13px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.todo-item:hover {
  background: var(--bg-secondary);
}

.todo-item.dispute-item {
  background: #fff2f0;
  border-left: 3px solid #ff4d4f;
  padding-left: 9px;
}

.todo-icon {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.todo-content {
  flex: 1;
  min-width: 0;
}

.todo-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.todo-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 3px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-text {
  font-size: 13px;
  color: var(--text-primary);
  line-height: 1.4;
}

.activity-operator {
  font-weight: 500;
}

.activity-role {
  color: var(--text-tertiary);
  font-size: 12px;
}

.activity-detail {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.activity-time {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.recent-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
  cursor: pointer;
  transition: background 0.2s;
  margin: 0 -4px;
  padding-left: 4px;
  padding-right: 4px;
  border-radius: 4px;
}

.recent-item:hover {
  background: var(--bg-secondary);
}

.recent-item:last-child {
  border-bottom: none;
}

.recent-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.recent-content {
  flex: 1;
  min-width: 0;
}

.recent-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
}

.recent-subtitle {
  font-size: 12px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.recent-time {
  font-size: 12px;
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.price-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-light);
}

.price-item:last-child {
  border-bottom: none;
}

.price-name {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  flex: 1;
}

.price-change {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.old-price {
  font-size: 13px;
  color: var(--text-tertiary);
  text-decoration: line-through;
}

.price-arrow {
  color: var(--text-tertiary);
  font-size: 12px;
}

.new-price {
  font-size: 14px;
  font-weight: 600;
}

.price-up {
  color: #ff4d4f;
}

.price-down {
  color: #52c41a;
}

.price-time {
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: right;
  flex-shrink: 0;
  width: 60px;
}
</style>
