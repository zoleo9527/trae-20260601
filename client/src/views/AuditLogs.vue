<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { auditLogApi } from '@/api'
import type { AuditLog } from '@/types'

const list = ref<AuditLog[]>([])
const total = ref(0)
const page = ref(1)
const pageSize = ref(30)
const loading = ref(false)

const filters = ref({
  biz_type: ''
})

const bizTypeOptions = [
  { value: '', label: '全部' },
  { value: 'reception', label: '接待单' },
  { value: 'guide_task', label: '向导任务' },
  { value: 'warehouse_transfer', label: '仓库交接' }
]

const bizTypeLabels: Record<string, string> = {
  reception: '接待单',
  guide_task: '向导任务',
  warehouse_transfer: '仓库交接',
  attachment: '附件'
}

async function loadData() {
  loading.value = true
  try {
    const params = {
      page: page.value,
      pageSize: pageSize.value,
      biz_type: filters.value.biz_type || undefined
    }
    const data = await auditLogApi.getList(params)
    list.value = data.list
    total.value = data.total
  } catch (e) {
    console.error('加载日志失败:', e)
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  page.value = 1
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
      <h1 class="page-title">操作日志</h1>
    </div>

    <div class="card">
      <div class="filter-bar">
        <div class="filter-item">
          <label>业务类型</label>
          <select v-model="filters.biz_type" class="form-select" style="min-width: 150px;">
            <option v-for="opt in bizTypeOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>
        </div>
        <div class="filter-item">
          <label>&nbsp;</label>
          <button class="btn btn-primary" @click="handleSearch">查询</button>
        </div>
      </div>

      <div class="table-wrapper">
        <table class="data-table">
          <thead>
            <tr>
              <th>业务类型</th>
              <th>业务ID</th>
              <th>操作</th>
              <th>操作人</th>
              <th>详情</th>
              <th>操作时间</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                加载中...
              </td>
            </tr>
            <tr v-else-if="list.length === 0">
              <td colspan="6" style="text-align: center; padding: 40px; color: #999;">
                暂无数据
              </td>
            </tr>
            <tr v-for="item in list" :key="item.id">
              <td>
                <span class="tag" style="background: #e6f7ff; color: #1890ff;">
                  {{ bizTypeLabels[item.biz_type] || item.biz_type }}
                </span>
              </td>
              <td>{{ item.biz_id }}</td>
              <td style="font-weight: 500;">{{ item.action }}</td>
              <td>{{ item.operator_name || '系统' }}</td>
              <td style="color: #666;">{{ item.detail || '-' }}</td>
              <td style="color: #999; font-size: 13px;">{{ item.created_at }}</td>
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
  </div>
</template>
