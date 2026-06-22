<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import {
  Plus,
  Search,
  Eye,
  Download,
  Calendar,
  User,
  MapPin,
  CheckCircle,
  Wrench,
  FileText
} from 'lucide-vue-next'
import { gasApi } from '@/api/gas'
import type { MeterChange } from '@/types/gas'

const router = useRouter()

const changes = ref<MeterChange[]>([])
const loading = ref(true)
const searchQuery = ref('')

const filteredChanges = computed(() => {
  if (!searchQuery.value) return changes.value
  
  const query = searchQuery.value.toLowerCase()
  return changes.value.filter(change => 
    change.customer_name.toLowerCase().includes(query) ||
    change.address.toLowerCase().includes(query) ||
    change.id.toLowerCase().includes(query)
  )
})

const handleExport = () => {
  const data = filteredChanges.value.map(change => ({
    换表编号: change.id,
    客户名称: change.customer_name,
    地址: change.address,
    原表表号: change.old_meter_number,
    新表表号: change.new_meter_number,
    表型: change.meter_type,
    换表日期: change.change_date,
    维修师傅: change.technician
  }))
  const csv = [Object.keys(data[0]).join(','), ...data.map(row => Object.values(row).join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = `换表记录_${new Date().toISOString().split('T')[0]}.csv`
  link.click()
}

async function fetchChanges() {
  loading.value = true
  try {
    const res = await gasApi.getMeterChanges()
    if (res.success) {
      changes.value = res.data
    }
  } catch (err) {
    console.error('获取换表记录失败:', err)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchChanges()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-slate-900">换表记录管理</h1>
        <p class="text-slate-500 mt-1">管理燃气表更换记录，跟踪换表情况</p>
      </div>
      <button
        @click="router.push('/gas/meter-changes/new')"
        class="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
      >
        <Plus class="w-5 h-5" />
        新建换表
      </button>
    </div>

    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm">
      <div class="px-6 py-4 border-b border-slate-200">
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="flex-1 relative">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索客户名称、地址或换表编号..."
              class="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          <button
            @click="handleExport"
            class="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download class="w-4 h-4" />
            导出
          </button>
        </div>
      </div>

      <div class="px-6 py-4 bg-slate-50 border-b border-slate-200">
        <span class="text-sm text-slate-400">共 {{ filteredChanges.length }} 条记录</span>
      </div>

      <div class="divide-y divide-slate-200">
        <div
          v-for="change in filteredChanges"
          :key="change.id"
          class="px-6 py-4 hover:bg-slate-50 transition-colors"
        >
          <div class="flex items-start gap-4">
            <div class="flex items-center gap-3 mb-2">
              <span class="text-sm font-medium text-slate-500">#{{ change.id }}</span>
              <span class="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700 flex items-center gap-1">
                <CheckCircle class="w-3 h-3" />
                已完成
              </span>
            </div>
          </div>
          <div class="flex flex-wrap items-center gap-4 text-sm text-slate-600">
            <div class="flex items-center gap-1">
              <User class="w-4 h-4 text-slate-400" />
              {{ change.customer_name }}
            </div>
            <div class="flex items-center gap-1">
              <MapPin class="w-4 h-4 text-slate-400" />
              {{ change.address }}
            </div>
            <div class="flex items-center gap-1">
              <Calendar class="w-4 h-4 text-slate-400" />
              {{ change.change_date }}
            </div>
            <div class="flex items-center gap-1">
              <Wrench class="w-4 h-4 text-slate-400" />
              {{ change.technician }}
            </div>
          </div>
          <div class="mt-2 flex flex-wrap items-center gap-4 text-sm">
            <span class="text-slate-500">
              <span class="font-medium text-slate-700">原表号：</span>{{ change.old_meter_number }}
            </span>
            <span class="text-slate-300">→</span>
            <span class="text-slate-500">
              <span class="font-medium text-slate-700">新表号：</span>{{ change.new_meter_number }}
            </span>
            <span v-if="change.meter_type" class="text-slate-500">
              <span class="font-medium text-slate-700">表型：</span>{{ change.meter_type }}
            </span>
            <span v-if="change.old_meter_reading" class="text-slate-500">
              <span class="font-medium text-slate-700">原读数：</span>{{ change.old_meter_reading }}
            </span>
            <span v-if="change.new_meter_reading" class="text-slate-500">
              <span class="font-medium text-slate-700">新读数：</span>{{ change.new_meter_reading }}
            </span>
          </div>
          <div v-if="change.remark" class="mt-2 text-sm text-slate-500">
            <FileText class="w-4 h-4 inline mr-1" />
            {{ change.remark }}
          </div>
          <div class="mt-3 flex items-center justify-end">
            <button
              @click="router.push(`/gas/meter-changes/${change.id}`)"
              class="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="查看详情"
            >
              <Eye class="w-4 h-4" />
            </button>
          </div>
        </div>

        <div v-if="filteredChanges.length === 0" class="px-6 py-16 text-center">
          <div class="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
            <Wrench class="w-8 h-8 text-slate-400" />
          </div>
          <h3 class="text-lg font-medium text-slate-900 mb-2">暂无换表记录</h3>
          <p class="text-slate-500 mb-4">当前筛选条件下没有找到相关的换表记录</p>
          <button
            @click="router.push('/gas/meter-changes/new')"
            class="inline-flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
          >
            <Plus class="w-4 h-4" />
            新建换表
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
