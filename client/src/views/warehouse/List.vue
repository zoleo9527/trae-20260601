<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { warehouseTransferApi } from '@/api'
import { warehouseStatusLabels, warehouseStatusColors } from '@/utils/constants'
import type { WarehouseTransfer } from '@/types'
import BatchActions from '@/components/BatchActions.vue'

const router = useRouter()

const list = ref<WarehouseTransfer[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const filters = ref({
  status: ''
})

const selectedIds = ref<number[]>([])
const showBatchModal = ref(false)

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filters.value
    }
    const data = await warehouseTransferApi.getList(params)
    list.value = data.list
    total.value = data.total
  } catch (e) {
    console.error('加载列表失败:', e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
  loadData()
}

function handleReset() {
  filters.value = { status: '' }
  page.value = 1
  loadData()
}

function goDetail(id: number) {
  router.push(`/warehouse/${id}`)
}

function toggleSelect(id: number) {
  const idx = selectedIds.value.indexOf(id)
  if (idx > -1) {
    selectedIds.value.splice(idx, 1)
  } else {
    selectedIds.value.push(id)
  }
}

function toggleSelectAll() {
  if (selectedIds.value.length === list.value.length && list.value.length > 0) {
    selectedIds.value = []
  } else {
    selectedIds.value = list.value.map(item => item.id)
  }
}

const isAllSelected = computed(() => {
  return list.value.length > 0 && selectedIds.value.length === list.value.length
})

function openBatchModal() {
  showBatchModal.value = true
}

function handleBatchDone() {
  showBatchModal.value = false
  selectedIds.value = []
  loadData()
}

function handlePageChange(p: number) {
  page.value = p
  loadData()
}

onMounted(() => {
  loadData()
})
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">仓库交接</h1>
      <div>
        <button
          class="btn btn-primary"
          :disabled="selectedIds.length === 0"
          @click="openBatchModal"
        >
          批量接收 ({{ selectedIds.length }})
        </button>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label>状态</label>
          <select v-model="filters.status" class="form-select" style="min-width: 120px;">
            <option value="">全部</option>
            <option v-for="(label, key) in warehouseStatusLabels" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>&nbsp;</label>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" @click="handleSearch">查询</button>
            <button class="btn" @click="handleReset">重置</button>
          </div>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th style="width: 40px;">
                <input
                  type="checkbox"
                  :checked="isAllSelected"
                  @change="toggleSelectAll"
                />
              </th>
              <th>交接单号</th>
              <th>任务编号</th>
              <th>团体名称</th>
              <th>总重量</th>
              <th>接收人</th>
              <th>状态</th>
              <th>创建时间</th>
              <th style="width: 100px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="9" style="text-align: center; padding: 40px; color: #999;">
                加载中...
              </td>
            </tr>
            <tr v-else-if="list.length === 0">
              <td colspan="9" style="text-align: center; padding: 40px; color: #999;">
                暂无数据
              </td>
            </tr>
            <tr v-for="item in list" :key="item.id">
              <td>
                <input
                  type="checkbox"
                  :checked="selectedIds.includes(item.id)"
                  @change="toggleSelect(item.id)"
                />
              </td>
              <td style="color: #1890ff; cursor: pointer;" @click="goDetail(item.id)">
                {{ item.transfer_no }}
              </td>
              <td>{{ item.task_no }}</td>
              <td>{{ item.group_name }}</td>
              <td>{{ item.total_weight }} 斤</td>
              <td>{{ item.received_by_name || '-' }}</td>
              <td>
                <span
                  class="tag"
                  :style="{
                    background: warehouseStatusColors[item.status] + '20',
                    color: warehouseStatusColors[item.status]
                  }"
                >
                  {{ warehouseStatusLabels[item.status] }}
                </span>
              </td>
              <td>{{ item.created_at }}</td>
              <td>
                <button class="btn btn-sm btn-link" @click="goDetail(item.id)">详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button :disabled="page === 1" @click="handlePageChange(page - 1)">上一页</button>
        <span style="color: #666; font-size: 13px;">
          第 {{ page }} 页 / 共 {{ Math.ceil(total / pageSize) }} 页，共 {{ total }} 条
        </span>
        <button
          :disabled="page >= Math.ceil(total / pageSize)"
          @click="handlePageChange(page + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <BatchActions
      v-if="showBatchModal"
      :selected-ids="selectedIds"
      biz-type="warehouse_transfer"
      @close="showBatchModal = false"
      @success="handleBatchDone"
    />
  </div>
</template>
