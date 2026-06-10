<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useApi } from '@/composables/useApi'
import { Filter } from 'lucide-vue-next'
import RoleBadge from '@/components/RoleBadge.vue'
import Pagination from '@/components/Pagination.vue'

const api = useApi()

const roleFilter = ref('')
const actionFilter = ref('')
const dateFrom = ref('')
const dateTo = ref('')
const logs = ref<any[]>([])
const page = ref(1)
const total = ref(0)
const pageSize = 15
const loading = ref(false)

const roleOptions = ['繁育员', '兽医', '场长']
const actionOptions = [
  { value: 'create', label: '创建转栏' },
  { value: 'confirm', label: '确认转栏' },
  { value: 'submit', label: '提交评估' },
  { value: 'assess', label: '完成评估' },
  { value: 'approve', label: '审批通过' },
  { value: 'reject', label: '审批驳回' },
]

const actionLabelMap: Record<string, string> = {
  create: '创建转栏',
  confirm: '确认转栏',
  submit: '提交评估',
  assess: '完成评估',
  approve: '审批通过',
  reject: '审批驳回',
}

async function fetchLogs() {
  loading.value = true
  try {
    const params: Record<string, string | number> = { page: page.value, pageSize }
    if (roleFilter.value) params.role = roleFilter.value
    if (actionFilter.value) params.action = actionFilter.value
    if (dateFrom.value) params.dateFrom = dateFrom.value
    if (dateTo.value) params.dateTo = dateTo.value
    const res = await api.getLogs(params)
    logs.value = res.data?.list || res.list || []
    total.value = res.data?.total || res.total || 0
  } catch {
    logs.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

onMounted(fetchLogs)
watch(page, fetchLogs)
</script>

<template>
  <div class="space-y-5">
    <h2 class="text-xl font-semibold text-slate-100">操作日志</h2>

    <div class="card">
      <div class="flex items-center gap-2 mb-4">
        <Filter :size="16" class="text-slate-500" />
        <span class="text-sm text-slate-400">筛选</span>
      </div>
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <select v-model="roleFilter" class="select-field text-sm">
          <option value="">全部角色</option>
          <option v-for="r in roleOptions" :key="r" :value="r">{{ r }}</option>
        </select>
        <select v-model="actionFilter" class="select-field text-sm">
          <option value="">全部操作</option>
          <option v-for="a in actionOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
        </select>
        <input v-model="dateFrom" type="date" class="input-field text-sm" />
        <input v-model="dateTo" type="date" class="input-field text-sm" />
      </div>
      <button class="btn-primary mt-3 text-sm" @click="fetchLogs">查询</button>
    </div>

    <div class="card overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-slate-700">
            <th class="text-left py-3 px-3 text-slate-500 font-medium">时间</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">操作人</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">角色</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">操作类型</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">关联记录</th>
            <th class="text-left py-3 px-3 text-slate-500 font-medium">详情</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading">
            <td colspan="6" class="py-8 text-center text-slate-500">加载中...</td>
          </tr>
          <tr v-else-if="logs.length === 0">
            <td colspan="6" class="py-8 text-center text-slate-500">暂无日志</td>
          </tr>
          <tr
            v-for="log in logs"
            :key="log.id"
            class="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors"
          >
            <td class="py-3 px-3 text-slate-400 whitespace-nowrap">{{ log.created_at }}</td>
            <td class="py-3 px-3 text-slate-300">{{ log.operator }}</td>
            <td class="py-3 px-3"><RoleBadge :role="log.operator_role" /></td>
            <td class="py-3 px-3 text-slate-300">{{ actionLabelMap[log.action] || log.action }}</td>
            <td class="py-3 px-3 text-slate-400">{{ log.transfer_id || '-' }}</td>
            <td class="py-3 px-3 text-slate-400 max-w-[200px] truncate">{{ log.detail || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <Pagination v-model:current="page" :total="total" :page-size="pageSize" />
  </div>
</template>
