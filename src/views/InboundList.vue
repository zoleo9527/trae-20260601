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

const filteredInbounds = computed(() => {
  let list = store.inbounds
  if (searchKeyword.value) {
    const kw = searchKeyword.value.toLowerCase()
    list = list.filter(
      i =>
        i.registrationNo.toLowerCase().includes(kw) ||
        i.supplierName.toLowerCase().includes(kw) ||
        i.vehicleNo.toLowerCase().includes(kw)
    )
  }
  if (statusFilter.value !== 'all') {
    list = list.filter(i => i.status === statusFilter.value)
  }
  return list
})

const statusOptions = [
  { value: 'all', label: '全部状态' },
  { value: 'draft', label: '草稿' },
  { value: 'submitted', label: '已提交' },
  { value: 'confirmed', label: '已确认' },
  { value: 'disputed', label: '有争议' }
]

function goDetail(id: string) {
  store.addRecentItem({
    id,
    type: 'inbound',
    title: store.getInboundById(id)?.registrationNo || '',
    subtitle: `${store.getInboundById(id)?.supplierName || ''} - ${store.getInboundById(id)?.mainCategoryName || ''}`,
    status: store.getInboundById(id)?.status || '',
    visitedAt: dayjs().toISOString()
  })
  router.push(`/inbound/${id}`)
}

function goNew() {
  router.push('/inbound/new')
}
</script>

<template>
  <div class="inbound-list">
    <div class="list-header">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchKeyword"
          type="text"
          class="search-input"
          placeholder="搜索单号、供应商、车牌号..."
        />
      </div>
      <div class="header-right">
        <select v-model="statusFilter" class="form-select status-select">
          <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
            {{ opt.label }}
          </option>
        </select>
        <button class="btn btn-primary" @click="goNew">
          ➕ 新建登记
        </button>
      </div>
    </div>

    <div class="list-card">
      <table class="table">
        <thead>
          <tr>
            <th>登记单号</th>
            <th>供应商</th>
            <th>车牌号</th>
            <th>主品类</th>
            <th>是否混装</th>
            <th>净重(kg)</th>
            <th>状态</th>
            <th>提交人</th>
            <th>创建时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in filteredInbounds" :key="item.id" class="table-row">
            <td class="no-cell">{{ item.registrationNo }}</td>
            <td>{{ item.supplierName || '-' }}</td>
            <td>{{ item.vehicleNo || '-' }}</td>
            <td>{{ item.mainCategoryName || '-' }}</td>
            <td>
              <span v-if="item.isMixed" class="badge badge-warning">
                混装 ({{ item.mixedItems.length }}种)
              </span>
              <span v-else class="badge">纯品类</span>
            </td>
            <td class="weight-cell">{{ item.netWeight.toLocaleString() }}</td>
            <td>
              <StatusBadge :status="item.status" />
            </td>
            <td>{{ item.submittedBy || '-' }}</td>
            <td class="time-cell">{{ dayjs(item.createdAt).format('MM-DD HH:mm') }}</td>
            <td>
              <button class="btn btn-sm" @click="goDetail(item.id)">查看</button>
            </td>
          </tr>
          <tr v-if="filteredInbounds.length === 0">
            <td colspan="10" class="empty-cell">
              <div class="empty-content">
                <div class="empty-icon">📋</div>
                <div class="empty-text">暂无进厂登记单</div>
                <button class="btn btn-primary btn-sm mt-16" @click="goNew">新建第一张</button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.inbound-list {
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
</style>
