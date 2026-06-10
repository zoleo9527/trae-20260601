<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { inventoryApi, batchApi } from '../api/resources'
import { GRADE_LABELS, ROLE_LABELS } from '../types'
import type { InventoryChangeLog, InventoryItem, FruitBatch } from '../types'

const route = useRoute()
const router = useRouter()
const changeLogs = ref<InventoryChangeLog[]>([])
const inventory = ref<InventoryItem[]>([])
const batches = ref<FruitBatch[]>([])
const loading = ref(true)
const filterBatchNo = ref('')
const filterFruitType = ref('')
const filterChangeType = ref('')
const hasAppliedQuery = ref(false)

const fruitTypes = computed(() => {
  const set = new Set<string>()
  inventory.value.forEach(i => set.add(i.fruit_type))
  changeLogs.value.forEach(l => {
    const match = inventory.value.find(i => i.id === l.inventory_item_id)
    if (match) set.add(match.fruit_type)
  })
  return Array.from(set)
})

const filteredLogs = computed(() => {
  let result = changeLogs.value
  if (filterBatchNo.value) {
    result = result.filter(l => l.related_batch_no && l.related_batch_no.includes(filterBatchNo.value))
  }
  if (filterFruitType.value) {
    const itemIds = inventory.value.filter(i => i.fruit_type === filterFruitType.value).map(i => i.id)
    result = result.filter(l => itemIds.includes(l.inventory_item_id))
  }
  if (filterChangeType.value) {
    result = result.filter(l => l.change_type === filterChangeType.value)
  }
  return result
})

const stats = computed(() => {
  let totalIn = 0
  let totalOut = 0
  filteredLogs.value.forEach(l => {
    if (l.change_amount >= 0) totalIn += l.change_amount
    else totalOut += Math.abs(l.change_amount)
  })
  return { totalIn, totalOut, net: totalIn - totalOut, count: filteredLogs.value.length }
})

onMounted(async () => {
  await Promise.all([loadLogs(), loadInventory(), loadBatches()])
  const queryBatchNo = route.query.batch as string
  if (queryBatchNo) {
    filterBatchNo.value = queryBatchNo
    hasAppliedQuery.value = true
  }
  loading.value = false
})

async function loadLogs() {
  try {
    const res = await inventoryApi.getChangelog({ limit: 200 })
    changeLogs.value = res.data
  } catch {}
}

async function loadInventory() {
  try {
    const res = await inventoryApi.list()
    inventory.value = res.data
  } catch {}
}

async function loadBatches() {
  try {
    const res = await batchApi.list()
    batches.value = res.data
  } catch {}
}

function clearFilter() {
  filterBatchNo.value = ''
  filterFruitType.value = ''
  filterChangeType.value = ''
  hasAppliedQuery.value = false
  router.replace({ query: {} })
}

function formatTime(t: string | null) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}

function changeTypeLabel(type: string) {
  const map: Record<string, string> = {
    grading_in: '分级入库',
    manual_adjust: '手动增加',
    manual_deduct: '手动扣减',
    reservation_out: '预约出库',
  }
  return map[type] || type
}

function getFruitInfo(itemId: number) {
  const item = inventory.value.find(i => i.id === itemId)
  if (!item) return { fruit_type: '-', grade: '-' }
  return { fruit_type: item.fruit_type, grade: item.grade }
}

function viewBatch(batchNo: string) {
  if (!batchNo) return
  const match = batchNo.match(/#?(\d+)/)
  if (match) {
    const resId = parseInt(match[1])
    router.push({ name: 'reservation-detail', params: { id: resId } })
    return
  }
  const batch = batches.value.find(b => b.batch_no === batchNo)
  if (batch) {
    router.push({ name: 'batch-detail', params: { id: batch.id } })
  }
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-ghost btn-sm" @click="$router.push({ name: 'inventory' })">← 返回库存</button>
        <h1 class="page-title">📋 库存变更回看</h1>
      </div>
    </div>

    <div v-if="stats.count > 0" class="card mb-4">
      <div class="stats-row">
        <div class="stat-item">
          <div class="stat-label">记录条数</div>
          <div class="stat-value stat-blue">{{ stats.count }}</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">入库总量</div>
          <div class="stat-value stat-green">+{{ stats.totalIn.toFixed(1) }} 斤</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">出库总量</div>
          <div class="stat-value stat-red">-{{ stats.totalOut.toFixed(1) }} 斤</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">净变动</div>
          <div class="stat-value" :class="stats.net >= 0 ? 'stat-green' : 'stat-red'">
            {{ stats.net >= 0 ? '+' : '' }}{{ stats.net.toFixed(1) }} 斤
          </div>
        </div>
      </div>
    </div>

    <div class="card mb-4">
      <div v-if="hasAppliedQuery && filterBatchNo" class="filter-active-alert">
        <span>🔍 已自动筛选批次 <strong>{{ filterBatchNo }}</strong> 相关的库存变动</span>
        <button class="btn btn-ghost btn-sm ml-auto" @click="clearFilter">清除筛选</button>
      </div>
      <div class="filter-row">
        <div class="filter-item">
          <label class="filter-label">批次号/预约号</label>
          <input v-model="filterBatchNo" class="form-input" style="width:180px" placeholder="如 PK-20260610 或 预约#3" />
        </div>
        <div class="filter-item">
          <label class="filter-label">果品</label>
          <select v-model="filterFruitType" class="form-select" style="width:140px">
            <option value="">全部</option>
            <option v-for="f in fruitTypes" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>
        <div class="filter-item">
          <label class="filter-label">变更类型</label>
          <select v-model="filterChangeType" class="form-select" style="width:140px">
            <option value="">全部</option>
            <option value="grading_in">分级入库</option>
            <option value="reservation_out">预约出库</option>
            <option value="manual_adjust">手动增加</option>
            <option value="manual_deduct">手动扣减</option>
          </select>
        </div>
        <button class="btn btn-ghost btn-sm" @click="clearFilter">清除筛选</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <div v-else class="card">
      <div v-if="filteredLogs.length === 0" class="empty-state">
        <div class="empty-state-icon">📋</div>
        <p>暂无符合条件的变更记录</p>
      </div>
      <table v-else class="data-table">
        <thead>
          <tr>
            <th>时间</th>
            <th>果品</th>
            <th>等级</th>
            <th>变更类型</th>
            <th>变更前</th>
            <th>变更后</th>
            <th>变动量</th>
            <th>原因</th>
            <th>操作人</th>
            <th>关联来源</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">
            <td class="text-sm">{{ formatTime(log.created_at) }}</td>
            <td class="font-bold">{{ getFruitInfo(log.inventory_item_id).fruit_type }}</td>
            <td>
              <span class="badge" :class="{
                'badge-success': getFruitInfo(log.inventory_item_id).grade === 'A',
                'badge-warning': getFruitInfo(log.inventory_item_id).grade === 'B',
                'badge-info': getFruitInfo(log.inventory_item_id).grade === 'C',
                'badge-danger': getFruitInfo(log.inventory_item_id).grade === 'D',
              }">{{ GRADE_LABELS[getFruitInfo(log.inventory_item_id).grade] || getFruitInfo(log.inventory_item_id).grade }}</span>
            </td>
            <td>
              <span class="badge" :class="{
                'badge-success': log.change_type === 'grading_in',
                'badge-danger': log.change_type === 'reservation_out' || log.change_type === 'manual_deduct',
                'badge-info': log.change_type === 'manual_adjust',
              }">{{ changeTypeLabel(log.change_type) }}</span>
            </td>
            <td>{{ log.quantity_before.toFixed(1) }}</td>
            <td>{{ log.quantity_after.toFixed(1) }}</td>
            <td :class="log.change_amount >= 0 ? 'text-positive' : 'text-negative'" class="font-bold">
              {{ log.change_amount >= 0 ? '+' : '' }}{{ log.change_amount.toFixed(1) }}
            </td>
            <td class="text-sm">{{ log.reason }}</td>
            <td>
              <span class="text-sm">
                <span class="op-role-badge" :class="'op-' + log.operator_role" style="margin-right:4px">
                  {{ ROLE_LABELS[log.operator_role] || log.operator_role }}
                </span>
                {{ log.operator_name }}
              </span>
            </td>
            <td>
              <span v-if="log.related_batch_no" class="badge badge-gray clickable-badge" @click="viewBatch(log.related_batch_no)">
                {{ log.related_batch_no }}
              </span>
              <span v-else class="text-gray">-</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<style scoped>
.text-positive { color: var(--success); font-weight: 600; }
.text-negative { color: var(--danger); font-weight: 600; }

.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px;
  background: var(--gray-50);
  border-radius: 8px;
}

.stat-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 4px;
}

.stat-value {
  font-size: 22px;
  font-weight: 700;
}

.stat-blue { color: #1565c0; }
.stat-green { color: var(--success); }
.stat-red { color: var(--danger); }

.filter-row {
  display: flex;
  align-items: flex-end;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.filter-label {
  font-size: 12px;
  color: var(--gray-500);
}

.op-role-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
}
.op-customer_service { background: #e3f2fd; color: #1565c0; }
.op-picking_guide { background: #fff3e0; color: #e65100; }
.op-warehouse { background: #e8f5e9; color: #2e7d32; }
.op-system { background: #f3e5f5; color: #6a1b9a; }

.clickable-badge { cursor: pointer; }
.clickable-badge:hover { opacity: 0.8; }

.filter-active-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  margin-bottom: 14px;
  background: #e3f2fd;
  border-left: 4px solid #1976d2;
  border-radius: 6px;
  font-size: 13px;
  color: #1565c0;
}

.filter-active-alert .ml-auto {
  margin-left: auto;
}

@media (max-width: 768px) {
  .stats-row { grid-template-columns: repeat(2, 1fr); }
}
</style>
