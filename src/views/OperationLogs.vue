<script setup lang="ts">
import { ref, computed } from 'vue'
import { useDataStore } from '@/stores/data'
import dayjs from 'dayjs'

const store = useDataStore()

const typeFilter = ref('all')
const searchKeyword = ref('')

const filteredLogs = computed(() => {
  let logs = store.operationLogs
  if (typeFilter.value !== 'all') {
    logs = logs.filter(l => l.targetType === typeFilter.value)
  }
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    logs = logs.filter(
      l =>
        l.action.toLowerCase().includes(kw) ||
        l.detail.toLowerCase().includes(kw) ||
        l.operator.toLowerCase().includes(kw)
    )
  }
  return logs
})

const typeOptions = [
  { value: 'all', label: '全部类型' },
  { value: 'inbound', label: '进厂登记' },
  { value: 'review', label: '过磅复核' },
  { value: 'dispute', label: '争议处理' }
]

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    inbound: '进厂登记',
    review: '过磅复核',
    dispute: '争议处理'
  }
  return map[type] || type
}

function getActionIcon(action: string) {
  if (action.includes('创建')) return '➕'
  if (action.includes('提交')) return '📤'
  if (action.includes('确认') || action.includes('复核')) return '✅'
  if (action.includes('驳回')) return '❌'
  if (action.includes('争议')) return '⚠️'
  if (action.includes('更新')) return '✏️'
  if (action.includes('价格') || action.includes('变动')) return '💰'
  if (action.includes('解决')) return '🔧'
  return '📝'
}
</script>

<template>
  <div class="logs-page">
    <div class="page-header">
      <h2 class="page-title">📝 操作日志</h2>
      <div class="header-filters">
        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input
            v-model="searchKeyword"
            type="text"
            class="search-input"
            placeholder="搜索操作..."
          />
        </div>
        <select v-model="typeFilter" class="form-select filter-select">
          <option v-for="opt in typeOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
      </div>
    </div>

    <div class="logs-card card">
      <table class="table">
        <thead>
          <tr>
            <th style="width: 60px"></th>
            <th style="width: 100px">类型</th>
            <th style="width: 160px">操作</th>
            <th>详情</th>
            <th style="width: 120px">操作人</th>
            <th style="width: 160px">时间</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">
            <td>
              <span class="action-icon">{{ getActionIcon(log.action) }}</span>
            </td>
            <td>
              <span class="type-tag">{{ getTypeLabel(log.targetType) }}</span>
            </td>
            <td class="action-cell">{{ log.action }}</td>
            <td class="detail-cell">{{ log.detail }}</td>
            <td>
              <div class="operator-cell">
                <span class="operator-name">{{ log.operator }}</span>
                <span class="operator-role">{{ log.operatorRole }}</span>
              </div>
            </td>
            <td class="time-cell">{{ dayjs(log.timestamp).format('YYYY-MM-DD HH:mm:ss') }}</td>
          </tr>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="6" class="empty-cell">
              <div class="empty-state">
                <div class="empty-icon">📝</div>
                <div>暂无操作日志</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.logs-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.header-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.search-box {
  position: relative;
  width: 240px;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: var(--text-tertiary);
}

.search-input {
  width: 100%;
  padding: 7px 12px 7px 32px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  outline: none;
  background: #fff;
  font-size: 13px;
}

.search-input:focus {
  border-color: var(--primary-color);
}

.filter-select {
  width: 120px;
}

.logs-card {
  background: #fff;
  border-radius: 8px;
  border: 1px solid var(--border-light);
  overflow: hidden;
}

.action-icon {
  font-size: 18px;
}

.type-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: var(--bg-secondary);
  color: var(--text-secondary);
}

.action-cell {
  font-weight: 500;
  color: var(--text-primary);
}

.detail-cell {
  color: var(--text-secondary);
  font-size: 13px;
}

.operator-cell {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.operator-name {
  font-size: 13px;
  color: var(--text-primary);
  font-weight: 500;
}

.operator-role {
  font-size: 11px;
  color: var(--text-tertiary);
}

.time-cell {
  font-size: 12px;
  color: var(--text-tertiary);
  font-family: 'SF Mono', Monaco, monospace;
}

.empty-cell {
  padding: 60px 20px !important;
  text-align: center;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
}

.empty-icon {
  font-size: 40px;
  opacity: 0.5;
}
</style>
