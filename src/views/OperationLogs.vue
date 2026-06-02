<script setup lang="ts">
import { ref, onMounted } from 'vue'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const logs = ref<any[]>([])
const loading = ref(false)
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)
const filters = ref({
  operator: '',
  action: '',
  startDate: '',
  endDate: ''
})

const loadData = async () => {
  loading.value = true
  try {
    const result = await window.api.operationLog.list(
      page.value, pageSize.value, filters.value
    )
    logs.value = result.data
    total.value = result.total
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const handleSearch = () => {
  page.value = 1
  loadData()
}

const handleReset = () => {
  filters.value = { operator: '', action: '', startDate: '', endDate: '' }
  page.value = 1
  loadData()
}

const handleExport = async () => {
  const result = await window.api.app.showSaveDialog({
    title: '导出操作记录',
    defaultPath: `操作记录_${new Date().toISOString().slice(0, 10)}.csv`,
    filters: [{ name: 'CSV文件', extensions: ['csv'] }]
  })
  if (!result.canceled && result.filePath) {
    const count = await window.api.operationLog.exportCsv(result.filePath, filters.value)
    alert(`成功导出 ${count} 条记录到：${result.filePath}`)
  }
}

const totalPages = () => Math.ceil(total.value / pageSize.value)

const getTargetTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    house: '房屋', resident: '住户', permission_group: '权限组',
    access_card: '门禁卡', card_application: '申请', operation_log: '操作记录'
  }
  return map[type] || type
}
</script>

<template>
  <div>
    <div class="card mb-4">
      <div class="card-header">
        <span class="text-gray">共 {{ total }} 条记录</span>
        <div class="flex gap-2">
          <button class="btn" @click="handleReset">重置</button>
          <button class="btn" @click="handleExport">📤 导出CSV</button>
        </div>
      </div>
      <div class="card-body">
        <div class="form-row mb-0">
          <div class="form-group mb-0">
            <label class="form-label">操作人</label>
            <input v-model="filters.operator" class="form-control" placeholder="搜索操作人" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">操作类型</label>
            <input v-model="filters.action" class="form-control" placeholder="如：制卡、挂失、审核" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">开始日期</label>
            <input v-model="filters.startDate" type="date" class="form-control" />
          </div>
          <div class="form-group mb-0">
            <label class="form-label">结束日期</label>
            <input v-model="filters.endDate" type="date" class="form-control" />
          </div>
        </div>
        <div class="text-right mt-2">
          <button class="btn btn-primary" @click="handleSearch">搜索</button>
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-body" style="padding: 0;">
        <div v-if="loading" class="empty">加载中...</div>
        <div v-else class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>操作时间</th>
                <th>操作人</th>
                <th>操作类型</th>
                <th>目标类型</th>
                <th>目标ID</th>
                <th>详情</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="log in logs" :key="log.id">
                <td class="text-sm text-gray">{{ log.createdAt }}</td>
                <td><strong>{{ log.operator }}</strong></td>
                <td><span class="tag tag-primary">{{ log.action }}</span></td>
                <td>{{ getTargetTypeLabel(log.targetType) }}</td>
                <td>{{ log.targetId }}</td>
                <td class="text-sm">{{ log.detail }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <button :disabled="page === 1" @click="page--; loadData()">上一页</button>
          <button
            v-for="p in Math.min(5, totalPages())"
            :key="p"
            :class="{ active: p === page }"
            @click="page = p; loadData()"
          >
            {{ p }}
          </button>
          <span v-if="totalPages() > 5" class="text-gray">... {{ totalPages() }}</span>
          <button :disabled="page >= totalPages()" @click="page++; loadData()">下一页</button>
          <span class="text-gray ml-4">第 {{ page }} / {{ totalPages() }} 页</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.ml-4 {
  margin-left: 16px;
}
</style>
