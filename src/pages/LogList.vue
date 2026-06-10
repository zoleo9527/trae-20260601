<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getLogs } from '@/api/logs'
import type { OperationLog } from '@/types'

const logs = ref<OperationLog[]>([])
const total = ref(0)
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)

const filters = ref({
  entityType: '',
  entityId: '',
  action: '',
  dateRange: null as [string, string] | null,
})

const entityTypeOptions = [
  { label: '全部', value: '' },
  { label: '订货单', value: 'order' },
  { label: '到货通知', value: 'arrival' },
  { label: '附件', value: 'attachment' },
]

const actionOptions = [
  { label: '全部', value: '' },
  { label: '创建', value: 'create' },
  { label: '更新', value: 'update' },
  { label: '状态变更', value: 'status_change' },
  { label: '确认', value: 'confirm' },
  { label: '删除', value: 'delete' },
  { label: '附件', value: 'attach' },
]

const actionTagMap: Record<string, { label: string; type: string }> = {
  create: { label: '创建', type: 'success' },
  update: { label: '更新', type: 'primary' },
  status_change: { label: '状态变更', type: 'warning' },
  confirm: { label: '确认', type: 'success' },
  delete: { label: '删除', type: 'danger' },
  attach: { label: '附件', type: 'info' },
}

const entityTypeLabels: Record<string, string> = {
  order: '订货单',
  arrival: '到货通知',
  attachment: '附件',
}

async function fetchLogs() {
  loading.value = true
  try {
    const params: Record<string, any> = {
      page: page.value,
      page_size: pageSize.value,
    }
    if (filters.value.entityType) params.entity_type = filters.value.entityType
    if (filters.value.entityId) params.entity_id = filters.value.entityId
    if (filters.value.action) params.action = filters.value.action
    if (filters.value.dateRange) {
      params.date_from = filters.value.dateRange[0]
      params.date_to = filters.value.dateRange[1]
    }
    const res = await getLogs(params)
    logs.value = res.data.items || []
    total.value = res.data.total || 0
  } catch {
  } finally {
    loading.value = false
  }
}

function handlePageChange(val: number) {
  page.value = val
  fetchLogs()
}

onMounted(fetchLogs)
</script>

<template>
  <div class="p-6">
    <h1 class="text-xl font-bold mb-5">操作日志</h1>

    <el-card class="mb-5">
      <div class="flex items-center gap-4 flex-wrap">
        <el-select v-model="filters.entityType" placeholder="实体类型" clearable style="width: 140px" @change="fetchLogs">
          <el-option v-for="opt in entityTypeOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-input v-model="filters.entityId" placeholder="实体ID搜索" clearable style="width: 160px" @clear="fetchLogs" @keyup.enter="fetchLogs" />
        <el-select v-model="filters.action" placeholder="操作类型" clearable style="width: 140px" @change="fetchLogs">
          <el-option v-for="opt in actionOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
        </el-select>
        <el-date-picker v-model="filters.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 280px" />
        <el-button type="primary" @click="fetchLogs">搜索</el-button>
      </div>
    </el-card>

    <el-card>
      <el-table :data="logs" v-loading="loading" stripe>
        <el-table-column prop="created_at" label="时间" width="180" />
        <el-table-column label="实体类型" width="100">
          <template #default="{ row }">{{ entityTypeLabels[row.entity_type] || row.entity_type }}</template>
        </el-table-column>
        <el-table-column prop="entity_id" label="实体ID" width="100" />
        <el-table-column label="操作类型" width="120">
          <template #default="{ row }">
            <el-tag :type="actionTagMap[row.action]?.type" size="small">{{ actionTagMap[row.action]?.label || row.action }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="详情" min-width="250">
          <template #default="{ row }">{{ row.detail.length > 50 ? row.detail.slice(0, 50) + '...' : row.detail }}</template>
        </el-table-column>
        <el-table-column prop="operator" label="操作人" width="120" />
      </el-table>
      <div class="flex justify-end mt-4">
        <el-pagination
          v-model:current-page="page"
          :page-size="pageSize"
          :total="total"
          layout="total, prev, pager, next"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>
