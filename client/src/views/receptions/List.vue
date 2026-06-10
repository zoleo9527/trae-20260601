<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { receptionApi } from '@/api'
import { receptionStatusLabels, receptionStatusColors } from '@/utils/constants'
import type { Reception } from '@/types'
import AssignGuideDialog from './components/AssignGuideDialog.vue'
import CreateReceptionDialog from './components/CreateReceptionDialog.vue'
import BatchActions from '@/components/BatchActions.vue'

const router = useRouter()

const list = ref<Reception[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(20)
const loading = ref(false)

const filters = ref({
  status: '',
  date_from: '',
  date_to: '',
  keyword: ''
})

const selectedIds = ref<number[]>([])
const showAssignDialog = ref(false)
const showCreateDialog = ref(false)
const selectedReceptionId = ref<number | null>(null)
const showBatchModal = ref(false)

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      ...filters.value
    }
    const data = await receptionApi.getList(params)
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
  filters.value = {
    status: '',
    date_from: '',
    date_to: '',
    keyword: ''
  }
  page.value = 1
  loadData()
}

function goDetail(id: number) {
  router.push(`/receptions/${id}`)
}

function handleCreate() {
  showCreateDialog.value = true
}

function handleCreateSuccess() {
  showCreateDialog.value = false
  loadData()
}

function openAssignDialog(id: number) {
  selectedReceptionId.value = id
  showAssignDialog.value = true
}

function handleAssigned() {
  showAssignDialog.value = false
  selectedReceptionId.value = null
  loadData()
}

async function exportData() {
  try {
    const params = { ...filters.value }
    const url = `/api/receptions/export?${new URLSearchParams(params as any).toString()}`
    window.open(url, '_blank')
  } catch (e: any) {
    alert('导出失败：' + (e.error || e.message))
  }
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
      <h1 class="page-title">团体接待</h1>
      <div style="display: flex; gap: 8px;">
        <button class="btn" @click="exportData">📥 导出</button>
        <button class="btn btn-primary" @click="handleCreate">+ 新建接待</button>
      </div>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label>状态</label>
          <select v-model="filters.status" class="form-select" style="min-width: 120px;">
            <option value="">全部</option>
            <option v-for="(label, key) in receptionStatusLabels" :key="key" :value="key">
              {{ label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>预约日期起</label>
          <input v-model="filters.date_from" type="date" class="form-input" style="width: 150px;" />
        </div>
        <div class="filter-item">
          <label>预约日期止</label>
          <input v-model="filters.date_to" type="date" class="form-input" style="width: 150px;" />
        </div>
        <div class="filter-item">
          <label>关键词</label>
          <input
            v-model="filters.keyword"
            type="text"
            class="form-input"
            style="width: 200px;"
            placeholder="团体名/联系人/单号"
          />
        </div>
        <div class="filter-item">
          <label>&nbsp;</label>
          <div style="display: flex; gap: 8px;">
            <button class="btn btn-primary" @click="handleSearch">查询</button>
            <button class="btn" @click="handleReset">重置</button>
          </div>
        </div>
      </div>

      <div v-if="selectedIds.length > 0" style="margin-bottom: 12px; padding: 8px 12px; background: #e6f7ff; border-radius: 4px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-size: 13px; color: #1890ff;">
          已选择 {{ selectedIds.length }} 项
        </span>
        <button class="btn btn-sm btn-primary" @click="openBatchModal">批量操作</button>
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
              <th>接待单号</th>
              <th>团体名称</th>
              <th>联系人</th>
              <th>人数</th>
              <th>预约日期</th>
              <th>状态</th>
              <th>创建人</th>
              <th>创建时间</th>
              <th style="width: 180px;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
                加载中...
              </td>
            </tr>
            <tr v-else-if="list.length === 0">
              <td colspan="10" style="text-align: center; padding: 40px; color: #999;">
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
                {{ item.reception_no }}
              </td>
              <td>{{ item.group_name }}</td>
              <td>{{ item.contact_person || '-' }}</td>
              <td>{{ item.people_count }}</td>
              <td>{{ item.scheduled_date }} {{ item.scheduled_time || '' }}</td>
              <td>
                <span
                  class="tag"
                  :style="{
                    background: receptionStatusColors[item.status] + '20',
                    color: receptionStatusColors[item.status]
                  }"
                >
                  {{ receptionStatusLabels[item.status] }}
                </span>
              </td>
              <td>{{ item.created_by_name || '-' }}</td>
              <td>{{ item.created_at }}</td>
              <td>
                <button class="btn btn-sm btn-link" @click="goDetail(item.id)">详情</button>
                <button
                  v-if="item.status === 'pending'"
                  class="btn btn-sm btn-link"
                  @click="openAssignDialog(item.id)"
                >
                  分配向导
                </button>
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

    <AssignGuideDialog
      v-if="showAssignDialog && selectedReceptionId"
      :reception-id="selectedReceptionId"
      @close="showAssignDialog = false"
      @success="handleAssigned"
    />

    <CreateReceptionDialog
      v-if="showCreateDialog"
      @close="showCreateDialog = false"
      @success="handleCreateSuccess"
    />

    <BatchActions
      v-if="showBatchModal"
      :selected-ids="selectedIds"
      biz-type="reception"
      @close="showBatchModal = false"
      @success="handleBatchDone"
    />
  </div>
</template>
