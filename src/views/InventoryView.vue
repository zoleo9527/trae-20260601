<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { inventoryApi, batchApi } from '../api/resources'
import { useAuthStore } from '../stores/auth'
import { GRADE_LABELS, STATUS_LABELS } from '../types'
import type { InventoryItem, FruitBatch } from '../types'

const auth = useAuthStore()
const router = useRouter()
const inventory = ref<InventoryItem[]>([])
const gradedBatches = ref<FruitBatch[]>([])
const loading = ref(true)
const showAdjust = ref(false)
const adjustItem = ref<InventoryItem | null>(null)
const adjustForm = ref({ change_amount: 0, reason: '' })
const adjusting = ref(false)

onMounted(async () => {
  await Promise.all([loadInventory(), loadPendingBatches()])
  loading.value = false
})

async function loadInventory() {
  try {
    const res = await inventoryApi.list()
    inventory.value = res.data
  } catch {}
}

async function loadPendingBatches() {
  try {
    const [gradedRes, warehousingRes] = await Promise.all([
      batchApi.list({ status: 'graded' }),
      batchApi.list({ status: 'warehousing' }),
    ])
    gradedBatches.value = [...gradedRes.data, ...warehousingRes.data]
  } catch {}
}

function openAdjust(item: InventoryItem) {
  adjustItem.value = item
  adjustForm.value = { change_amount: 0, reason: '' }
  showAdjust.value = true
}

async function handleAdjust() {
  if (!adjustItem.value || adjustForm.value.change_amount === 0) return
  adjusting.value = true
  try {
    await inventoryApi.adjust(adjustItem.value.id, {
      change_amount: adjustForm.value.change_amount,
      reason: adjustForm.value.reason,
      operator_name: auth.currentUser!.display_name,
      operator_role: auth.currentUser!.role,
    })
    showAdjust.value = false
    await loadInventory()
  } catch {}
  adjusting.value = false
}

async function confirmWarehousing(batchId: number) {
  try {
    await inventoryApi.confirmWarehousing(batchId, auth.currentUser!.display_name)
    await loadPendingBatches()
  } catch (e: any) {
    alert(e.response?.data?.detail || '入库操作失败')
  }
}

function viewChangelog() {
  router.push({ name: 'inventory-changelog' })
}

function viewBatchDetail(batchId: number) {
  router.push({ name: 'batch-detail', params: { id: batchId } })
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">📦 库存管理</h1>
      <div class="flex gap-2">
        <button class="btn btn-outline btn-sm" @click="viewChangelog">📋 库存回看</button>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <div v-if="gradedBatches.length > 0" class="card mb-4">
        <h3 class="card-title">🚚 入库操作</h3>
        <p class="text-sm text-gray mb-2">以下批次需完成入库流程</p>
        <table class="data-table">
          <thead>
            <tr>
              <th>批次号</th>
              <th>果品</th>
              <th>数量</th>
              <th>当前状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in gradedBatches" :key="b.id" class="clickable-row" @click="viewBatchDetail(b.id)">
              <td class="font-bold">{{ b.batch_no }}</td>
              <td>{{ b.fruit_type }}</td>
              <td>{{ b.quantity_picked }}{{ b.unit }}</td>
              <td>
                <span class="badge" :class="b.status === 'warehousing' ? 'badge-info' : 'badge-warning'">
                  {{ STATUS_LABELS[b.status] }}
                </span>
              </td>
              <td @click.stop>
                <button class="btn btn-sm" :class="b.status === 'warehousing' ? 'btn-success' : 'btn-primary'" @click="confirmWarehousing(b.id)">
                  {{ b.status === 'warehousing' ? '确认入库完成' : '开始入库' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="card">
        <h3 class="card-title">📊 当前库存</h3>
        <div v-if="inventory.length === 0" class="empty-state">
          <div class="empty-state-icon">📦</div>
          <p>暂无库存数据</p>
        </div>
        <table v-else class="data-table">
          <thead>
            <tr>
              <th>果品</th>
              <th>等级</th>
              <th>库存量</th>
              <th>单位</th>
              <th>仓库位置</th>
              <th>更新时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in inventory" :key="item.id">
              <td class="font-bold">{{ item.fruit_type }}</td>
              <td>
                <span class="badge" :class="{
                  'badge-success': item.grade === 'A',
                  'badge-warning': item.grade === 'B',
                  'badge-info': item.grade === 'C',
                  'badge-danger': item.grade === 'D',
                }">{{ GRADE_LABELS[item.grade] || item.grade }}</span>
              </td>
              <td class="font-bold">{{ item.quantity }}</td>
              <td>{{ item.unit }}</td>
              <td>{{ item.warehouse_location }}</td>
              <td class="text-sm text-gray">{{ item.updated_at ? new Date(item.updated_at).toLocaleString('zh-CN') : '-' }}</td>
              <td>
                <button class="btn btn-outline btn-sm" @click="openAdjust(item)">调整</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <div v-if="showAdjust && adjustItem" class="dialog-overlay" @click.self="showAdjust = false">
      <div class="dialog">
        <h3>调整库存 - {{ adjustItem.fruit_type }} {{ GRADE_LABELS[adjustItem.grade] }}</h3>
        <p class="text-sm text-gray mb-4">当前库存: {{ adjustItem.quantity }}{{ adjustItem.unit }}</p>
        <div class="form-group">
          <label class="form-label">调整数量（正数增加，负数减少）</label>
          <input type="number" v-model.number="adjustForm.change_amount" step="0.5" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">调整原因</label>
          <textarea v-model="adjustForm.reason" class="form-textarea" placeholder="说明调整原因"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showAdjust = false">取消</button>
          <button class="btn btn-primary" @click="handleAdjust" :disabled="adjusting || adjustForm.change_amount === 0">
            {{ adjusting ? '调整中...' : '确认调整' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 440px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
}

.dialog h3 {
  font-size: 18px;
  margin-bottom: 8px;
}
</style>
