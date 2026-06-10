<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">闭环归档 · 回看中心</h2>
        <p class="text-sm text-neutral-500 mt-1">所有已完成闭环的整改记录，责任链条完整可追溯</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <button type="button" class="btn-secondary text-xs py-1.5">
          <AppIcon name="IconDownload" class="w-3.5 h-3.5 mr-1" />
          导出归档清单
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-5 gap-4">
      <div v-for="s in archiveStats" :key="s.key" class="card p-4">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-lg flex items-center justify-center" :class="s.bgClass">
            <AppIcon :name="s.icon" :class="['w-4.5 h-4.5', s.iconClass]" />
          </div>
          <div>
            <div class="text-[11px] text-neutral-500">{{ s.label }}</div>
            <div class="text-lg font-bold" :class="s.colorClass">{{ s.value }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="card overflow-hidden">
      <div class="px-5 py-3 border-b border-neutral-200 flex items-center justify-between gap-3 flex-wrap">
        <div class="flex items-center gap-3 flex-wrap">
          <div class="relative">
            <AppIcon name="IconSearch" class="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索编号/电梯/整改人..."
              class="input pl-9 w-64 text-xs"
            />
          </div>
          <select v-model="yearFilter" class="input text-xs w-28">
            <option value="all">全部年份</option>
            <option value="2026">2026年</option>
            <option value="2025">2025年</option>
          </select>
          <select v-model="categoryFilter" class="input text-xs w-36">
            <option value="all">全部分类</option>
            <option value="safety">安全保护类</option>
            <option value="door">门系统类</option>
            <option value="machine">机房曳引类</option>
            <option value="car">轿厢类</option>
          </select>
        </div>
        <div class="text-xs text-neutral-500">
          共 <span class="font-semibold text-neutral-800">{{ filteredClosed.length }}</span> 条归档记录
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-neutral-50 text-xs text-neutral-600 border-b border-neutral-200">
            <tr>
              <th class="px-5 py-3 text-left font-semibold">整改编号</th>
              <th class="px-5 py-3 text-left font-semibold">电梯信息</th>
              <th class="px-5 py-3 text-left font-semibold">问题分类</th>
              <th class="px-5 py-3 text-center font-semibold">问题数</th>
              <th class="px-5 py-3 text-left font-semibold">整改人</th>
              <th class="px-5 py-3 text-center font-semibold">整改周期</th>
              <th class="px-5 py-3 text-center font-semibold">复查次数</th>
              <th class="px-5 py-3 text-left font-semibold">闭环日期</th>
              <th class="px-5 py-3 text-center font-semibold">归档状态</th>
              <th class="px-5 py-3 text-center font-semibold">操作</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr
              v-for="rect in filteredClosed"
              :key="rect.id"
              class="hover:bg-neutral-50 transition-colors"
            >
              <td class="px-5 py-4">
                <span class="font-mono text-xs font-bold text-primary-700 cursor-pointer hover:underline" @click="openDetail(rect)">{{ rect.id }}</span>
              </td>
              <td class="px-5 py-4">
                <div class="text-xs font-medium text-neutral-800">{{ rect.elevatorName }}</div>
                <div class="text-[11px] text-neutral-500 mt-0.5">{{ rect.location }}</div>
              </td>
              <td class="px-5 py-4">
                <div class="flex flex-wrap gap-1">
                  <span v-for="(c, i) in getCategories(rect)" :key="i" class="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                    {{ c }}
                  </span>
                </div>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="text-sm font-bold text-neutral-800">{{ rect.failItems.length }}</span>
              </td>
              <td class="px-5 py-4">
                <div class="flex items-center gap-2">
                  <div class="w-6 h-6 rounded-full bg-warning-500 text-white text-[10px] font-bold flex items-center justify-center">
                    {{ rect.assignedTo.charAt(0) }}
                  </div>
                  <span class="text-xs text-neutral-700">{{ rect.assignedTo }}</span>
                </div>
              </td>
              <td class="px-5 py-4 text-center">
                <span :class="['text-xs font-medium', getCycleDays(rect) <= 3 ? 'text-success-600' : getCycleDays(rect) <= 7 ? 'text-warning-600' : 'text-danger-600']">
                  {{ getCycleDays(rect) }} 天
                </span>
              </td>
              <td class="px-5 py-4 text-center">
                <span class="text-xs text-neutral-700">{{ rect.recheckResults?.length || 1 }} 次</span>
              </td>
              <td class="px-5 py-4">
                <div class="text-xs text-neutral-700">{{ rect.closedAt?.split('T')[0] || rect.updatedAt?.split('T')[0] }}</div>
                <div class="text-[10px] text-neutral-500 mt-0.5">{{ getInspectionDate(rect) }} 年检</div>
              </td>
              <td class="px-5 py-4 text-center">
                <div class="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-success-100 text-success-700 font-medium">
                  <AppIcon name="IconArchive" class="w-3 h-3" />
                  已归档
                </div>
              </td>
              <td class="px-5 py-4 text-center">
                <div class="flex items-center justify-center gap-1">
                  <button type="button" class="p-1.5 rounded-md hover:bg-primary-100 text-primary-600 transition-colors" title="查看责任链条" @click="openDetail(rect)">
                    <AppIcon name="IconGitBranch" class="w-4 h-4" />
                  </button>
                  <button type="button" class="p-1.5 rounded-md hover:bg-neutral-100 text-neutral-600 transition-colors" title="下载归档包">
                    <AppIcon name="IconDownload" class="w-4 h-4" />
                  </button>
                </div>
              </td>
            </tr>

            <tr v-if="filteredClosed.length === 0">
              <td colspan="10" class="px-5 py-12 text-center">
                <AppIcon name="IconArchive" class="w-12 h-12 mx-auto text-neutral-300" />
                <p class="text-sm text-neutral-500 mt-3">暂无符合条件的归档记录</p>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <RectificationDetailModal
      v-if="detailVisible"
      :record="selectedRectData"
      @close="closeDetail"
      @recheck="handleRecheck"
      @close-loop="handleCloseLoop"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'
import type { RectificationRecord } from '~/types'

const appStore = useAppStore()
const detailVisible = ref(false)
const selectedRectData = ref<RectificationRecord | null>(null)
const searchQuery = ref('')
const yearFilter = ref('all')
const categoryFilter = ref('all')

const archiveStats = computed(() => {
  const closed = appStore.rectifications.filter(r => r.status === 'closed' || r.status === 'passed')
  return [
    { key: 'total', label: '累计闭环', value: closed.length, icon: 'IconArchive', colorClass: 'text-success-600', bgClass: 'bg-success-100', iconClass: 'text-success-600' },
    { key: 'thisMonth', label: '本月闭环', value: closed.length, icon: 'IconCalendar', colorClass: 'text-primary-600', bgClass: 'bg-primary-100', iconClass: 'text-primary-600' },
    { key: 'onTime', label: '按期闭环率', value: '100%', icon: 'IconClock', colorClass: 'text-success-600', bgClass: 'bg-success-100', iconClass: 'text-success-600' },
    { key: 'avgCycle', label: '平均整改周期', value: '4.5天', icon: 'IconZap', colorClass: 'text-warning-600', bgClass: 'bg-warning-100', iconClass: 'text-warning-600' },
    { key: 'recheckAvg', label: '平均复查次数', value: '1.2次', icon: 'IconEye', colorClass: 'text-neutral-700', bgClass: 'bg-neutral-100', iconClass: 'text-neutral-600' }
  ]
})

const closedList = computed(() =>
  appStore.rectifications.filter(r => r.status === 'closed' || r.status === 'passed')
)

const filteredClosed = computed(() => {
  let list = [...closedList.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(r =>
      r.id.toLowerCase().includes(q) ||
      r.elevatorName.toLowerCase().includes(q) ||
      r.assignedTo.toLowerCase().includes(q)
    )
  }
  return list
})

function getCategories(rect: RectificationRecord) {
  const cats: string[] = []
  rect.failItems.forEach(item => {
    if (item.includes('1.') || item.includes('2.')) cats.push('机房曳引')
    if (item.includes('3.')) cats.push('轿厢')
    if (item.includes('4.')) cats.push('门系统')
    if (item.includes('5.')) cats.push('安全保护')
  })
  return [...new Set(cats)].slice(0, 3)
}

function getCycleDays(rect: RectificationRecord) {
  const start = new Date(rect.createdAt || rect.inspectionDate).getTime()
  const end = new Date(rect.closedAt || rect.updatedAt).getTime()
  return Math.max(1, Math.ceil((end - start) / 86400000))
}

function getInspectionDate(rect: RectificationRecord) {
  const insp = appStore.inspections.find(i => i.id === rect.inspectionId)
  return insp?.inspectionDate || '-'
}

function openDetail(rect: RectificationRecord) {
  selectedRectData.value = rect
  detailVisible.value = true
}

function closeDetail() {
  detailVisible.value = false
  selectedRectData.value = null
}

function handleRecheck(rect: RectificationRecord, result: 'pass' | 'fail') {
  appStore.updateRectificationStatus(rect.id, result === 'pass' ? 'passed' : 'in_progress')
  closeDetail()
}

function handleCloseLoop(rect: RectificationRecord) {
  appStore.updateRectificationStatus(rect.id, 'closed')
  closeDetail()
}
</script>
