<template>
  <div class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-neutral-800">不合格统计与分析</h2>
        <p class="text-sm text-neutral-500 mt-1">基于TSG T7001条款的不合格项趋势、分类与热点分析</p>
      </div>
      <div class="flex items-center gap-2 flex-wrap">
        <select v-model="periodFilter" class="input text-xs w-32">
          <option value="month">近30天</option>
          <option value="quarter">近90天</option>
          <option value="year">本年度</option>
        </select>
        <button type="button" class="btn-secondary text-xs py-1.5">
          <AppIcon name="IconDownload" class="w-3.5 h-3.5 mr-1" />
          导出分析报告
        </button>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-6 gap-4">
      <div v-for="s in summaryCards" :key="s.key" class="card p-4">
        <div class="text-[11px] text-neutral-500">{{ s.label }}</div>
        <div class="mt-1 flex items-end gap-1.5">
          <span class="text-2xl font-bold" :class="s.colorClass">{{ s.value }}</span>
          <span v-if="s.unit" class="text-xs text-neutral-500 mb-0.5">{{ s.unit }}</span>
        </div>
        <div v-if="s.trend" class="text-[11px] mt-1" :class="s.trendUp ? 'text-danger-600' : 'text-success-600'">
          <AppIcon :name="s.trendUp ? 'IconTrendingUp' : 'IconTrendingDown'" class="w-3 h-3 inline mr-0.5" />
          {{ s.trend }}
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
      <div class="card overflow-hidden">
        <div class="px-5 py-3.5 border-b border-neutral-200">
          <h3 class="text-sm font-semibold text-neutral-800">不合格项分类分布（按TSG条款大类）</h3>
        </div>
        <div class="p-5 space-y-4">
          <div v-for="cat in categoryStats" :key="cat.name" class="group">
            <div class="flex items-center justify-between text-xs mb-1.5">
              <div class="flex items-center gap-2">
                <span class="w-8 h-8 rounded-lg flex items-center justify-center" :class="cat.bgClass">
                  <AppIcon :name="cat.icon" :class="['w-4 h-4', cat.iconClass]" />
                </span>
                <span class="font-medium text-neutral-800">{{ cat.name }}</span>
              </div>
              <div class="flex items-center gap-3">
                <span class="font-bold text-neutral-800">{{ cat.count }} 项</span>
                <span class="text-neutral-500">{{ cat.percent }}%</span>
              </div>
            </div>
            <div class="h-6 rounded-lg bg-neutral-100 overflow-hidden flex">
              <div
                class="h-full rounded-l-lg transition-all flex items-center justify-end pr-2"
                :class="cat.barClass"
                :style="{ width: cat.percent + '%' }"
              >
                <span v-if="cat.percent > 10" class="text-[10px] font-medium text-white">{{ cat.count }}</span>
              </div>
            </div>
            <div class="mt-1.5 flex flex-wrap gap-1">
              <span
                v-for="(t, i) in cat.topItems"
                :key="i"
                class="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200 transition-colors"
              >
                {{ t }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="card overflow-hidden">
        <div class="px-5 py-3.5 border-b border-neutral-200 flex items-center justify-between">
          <h3 class="text-sm font-semibold text-neutral-800">Top 高频不合格条款</h3>
          <span class="text-[11px] text-neutral-500">近90天</span>
        </div>
        <div class="divide-y divide-neutral-100">
          <div
            v-for="(item, i) in topCriteria"
            :key="item.code"
            class="p-4 hover:bg-neutral-50 transition-colors cursor-pointer"
            @click="drillDownToCriteria(item.code)"
          >
            <div class="flex items-start gap-3">
              <div
                class="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0"
                :class="i < 3 ? 'bg-danger-100 text-danger-700' : 'bg-neutral-100 text-neutral-600'"
              >
                {{ i + 1 }}
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <span class="font-mono text-[11px] font-bold bg-primary-50 text-primary-700 px-1.5 py-0.5 rounded">
                    TSG {{ item.code }}
                  </span>
                  <span :class="['text-[10px] px-1.5 py-0.5 rounded font-medium', item.level === 'critical' ? 'bg-danger-100 text-danger-700' : 'bg-warning-100 text-warning-700']">
                    {{ item.level === 'critical' ? '关键项' : '一般项' }}
                  </span>
                </div>
                <div class="text-sm font-medium text-neutral-800 mt-1.5">{{ item.name }}</div>
                <div class="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{{ item.standard }}</div>
              </div>
              <div class="text-right flex-shrink-0">
                <div class="text-xl font-bold" :class="item.count >= 3 ? 'text-danger-600' : 'text-warning-600'">
                  {{ item.count }}
                </div>
                <div class="text-[10px] text-neutral-500">次不合格</div>
                <div class="mt-1 text-[10px] text-primary-600 hover:underline flex items-center justify-end gap-0.5">
                  查看详情
                  <AppIcon name="IconChevronRight" class="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
      <div class="xl:col-span-2 card overflow-hidden">
        <div class="px-5 py-3.5 border-b border-neutral-200">
          <h3 class="text-sm font-semibold text-neutral-800">电梯不合格次数排行</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 text-xs text-neutral-600 border-b border-neutral-200">
              <tr>
                <th class="px-5 py-3 text-left font-semibold">排名</th>
                <th class="px-5 py-3 text-left font-semibold">电梯编号</th>
                <th class="px-5 py-3 text-left font-semibold">位置</th>
                <th class="px-5 py-3 text-center font-semibold">年检次数</th>
                <th class="px-5 py-3 text-center font-semibold">不合格次数</th>
                <th class="px-5 py-3 text-center font-semibold">不合格率</th>
                <th class="px-5 py-3 text-left font-semibold">主要问题</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr v-for="(e, i) in elevatorRank" :key="e.id" class="hover:bg-neutral-50 transition-colors cursor-pointer">
                <td class="px-5 py-3.5">
                  <span
                    class="inline-flex w-6 h-6 rounded items-center justify-center text-xs font-bold"
                    :class="i === 0 ? 'bg-danger-100 text-danger-700' : i === 1 ? 'bg-warning-100 text-warning-700' : i === 2 ? 'bg-primary-100 text-primary-700' : 'bg-neutral-100 text-neutral-600'"
                  >
                    {{ i + 1 }}
                  </span>
                </td>
                <td class="px-5 py-3.5">
                  <div class="text-xs font-semibold text-neutral-800">{{ e.name }}</div>
                  <div class="text-[11px] text-neutral-500">{{ e.id }}</div>
                </td>
                <td class="px-5 py-3.5 text-xs text-neutral-600">{{ e.location }}</td>
                <td class="px-5 py-3.5 text-center text-xs font-medium text-neutral-700">{{ e.total }}</td>
                <td class="px-5 py-3.5 text-center">
                  <span class="text-xs font-bold" :class="e.failCount >= 3 ? 'text-danger-600' : 'text-warning-600'">
                    {{ e.failCount }}
                  </span>
                </td>
                <td class="px-5 py-3.5 text-center">
                  <div class="flex items-center justify-center gap-2">
                    <div class="w-16 h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                      <div
                        class="h-full rounded-full"
                        :class="e.rate >= 50 ? 'bg-danger-500' : e.rate >= 30 ? 'bg-warning-500' : 'bg-primary-500'"
                        :style="{ width: e.rate + '%' }"
                      ></div>
                    </div>
                    <span class="text-[11px] font-medium text-neutral-700">{{ e.rate }}%</span>
                  </div>
                </td>
                <td class="px-5 py-3.5">
                  <div class="flex flex-wrap gap-1">
                    <span
                      v-for="(t, k) in e.issues"
                      :key="k"
                      class="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600"
                    >
                      {{ t }}
                    </span>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="space-y-5">
        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-4">关键项 vs 一般项</h3>
          <div class="space-y-4">
            <div class="p-4 rounded-xl bg-danger-50 border border-danger-100">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <AppIcon name="IconZap" class="w-4 h-4 text-danger-600" />
                  <span class="text-xs font-semibold text-danger-800">关键项不合格</span>
                </div>
                <span class="text-xl font-bold text-danger-700">3</span>
              </div>
              <p class="text-[11px] text-danger-700 mt-2">涉及安全保护、紧急救援等，必须当日启动整改</p>
              <div class="mt-3 flex -space-x-1">
                <div v-for="n in 3" :key="n" class="w-5 h-5 rounded-full bg-danger-200 border-2 border-danger-50 flex items-center justify-center text-[9px] font-bold text-danger-700">
                  {{ n }}
                </div>
              </div>
            </div>
            <div class="p-4 rounded-xl bg-warning-50 border border-warning-100">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <AppIcon name="IconAlertCircle" class="w-4 h-4 text-warning-600" />
                  <span class="text-xs font-semibold text-warning-800">一般项不合格</span>
                </div>
                <span class="text-xl font-bold text-warning-700">4</span>
              </div>
              <p class="text-[11px] text-warning-700 mt-2">涉及舒适度、标识等，整改期内完成即可</p>
            </div>
          </div>
        </div>

        <div class="card p-5">
          <h3 class="text-sm font-semibold text-neutral-800 mb-3">整改效率分析</h3>
          <div class="space-y-3 text-xs">
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">平均整改周期</span>
              <span class="font-semibold text-success-600">4.5 天</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">按期完成率</span>
              <span class="font-semibold text-success-600">94.2%</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">一次复查通过率</span>
              <span class="font-semibold text-primary-600">86.7%</span>
            </div>
            <div class="flex items-center justify-between">
              <span class="text-neutral-600">平均复查次数</span>
              <span class="font-semibold text-neutral-700">1.15 次</span>
            </div>
          </div>
          <div class="mt-4 pt-4 border-t border-neutral-100">
            <div class="text-[11px] text-neutral-500 mb-2">环比上月</div>
            <div class="flex items-center gap-1 text-xs text-success-600">
              <AppIcon name="IconTrendingDown" class="w-3.5 h-3.5" />
              <span class="font-semibold">整改周期缩短 12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useAppStore } from '~/stores/app'

const appStore = useAppStore()
const periodFilter = ref('quarter')

const summaryCards = computed(() => {
  const allFailItems = appStore.inspections.flatMap(i => i.items.filter(it => it.result === 'fail'))
  return [
    { key: 'total', label: '年检总数', value: appStore.inspections.length, unit: '次', colorClass: 'text-neutral-800' },
    { key: 'fail', label: '不合格年检', value: appStore.inspections.filter(i => i.status === 'non_compliant' || i.status === 'rectifying').length, unit: '次', colorClass: 'text-danger-600', trend: '+25%', trendUp: true },
    { key: 'items', label: '不合格项数', value: allFailItems.length, unit: '项', colorClass: 'text-warning-600', trend: '+18%', trendUp: true },
    { key: 'critical', label: '关键项不合格', value: 3, unit: '项', colorClass: 'text-danger-700', trend: '持平', trendUp: false },
    { key: 'rate', label: '一次合格率', value: '75.0', unit: '%', colorClass: 'text-success-600', trend: '+5%', trendUp: false },
    { key: 'ontime', label: '按期闭环率', value: '94.5', unit: '%', colorClass: 'text-primary-600', trend: '+2%', trendUp: false }
  ]
})

const categoryStats = [
  { name: '机房与曳引系统', code: '1.x/2.x', icon: 'IconSettings', bgClass: 'bg-warning-100', iconClass: 'text-warning-600', barClass: 'bg-gradient-to-r from-warning-400 to-warning-500', count: 3, percent: 43, topItems: ['1.3紧急救援装置', '2.2钢丝绳磨损', '1.2控制柜标识'] },
  { name: '轿厢系统', code: '3.x', icon: 'IconBox', bgClass: 'bg-primary-100', iconClass: 'text-primary-600', barClass: 'bg-gradient-to-r from-primary-400 to-primary-500', count: 2, percent: 29, topItems: ['3.1紧急报警装置', '3.3平层精度'] },
  { name: '门系统', code: '4.x', icon: 'IconPanelLeft', bgClass: 'bg-success-100', iconClass: 'text-success-600', barClass: 'bg-gradient-to-r from-success-400 to-success-500', count: 1, percent: 14, topItems: ['4.2门防夹保护'] },
  { name: '安全保护系统', code: '5.x', icon: 'IconShield', bgClass: 'bg-danger-100', iconClass: 'text-danger-600', barClass: 'bg-gradient-to-r from-danger-400 to-danger-500', count: 1, percent: 14, topItems: ['5.2缓冲器'] }
]

const topCriteria = [
  { code: '1.3', name: '紧急救援装置', standard: '松闸扳手、盘车手轮配备齐全且标识清晰', count: 3, level: 'critical' },
  { code: '3.1', name: '紧急报警装置', standard: '警铃/对讲系统畅通，可与外界有效通话', count: 2, level: 'critical' },
  { code: '3.3', name: '平层精度', standard: '平层误差≤±5mm', count: 2, level: 'normal' },
  { code: '2.2', name: '钢丝绳磨损', standard: '钢丝绳直径减少量≤7%，无断丝超标', count: 1, level: 'critical' },
  { code: '4.2', name: '门防夹保护', standard: '关门受阻自动开门，触板/光幕有效', count: 1, level: 'normal' },
  { code: '5.2', name: '缓冲器', standard: '缓冲器完好，液压缓冲器油位正常', count: 1, level: 'critical' }
]

const elevatorRank = [
  { id: 'ELV-GX001', name: '1号楼A座-1号梯', location: '高新区A座', total: 6, failCount: 3, rate: 50, issues: ['紧急救援', '对讲系统', '平层精度'] },
  { id: 'ELV-GX003', name: '2号楼B座-1号梯', location: '高新区B座', total: 5, failCount: 2, rate: 40, issues: ['门防夹', '钢丝绳'] },
  { id: 'ELV-GX002', name: '1号楼A座-2号梯', location: '高新区A座', total: 6, failCount: 2, rate: 33, issues: ['机房温度', '缓冲器'] },
  { id: 'ELV-GX004', name: '2号楼B座-2号梯', location: '高新区B座', total: 4, failCount: 1, rate: 25, issues: ['平层精度'] }
]

function drillDownToCriteria(code: string) {
  navigateTo('/inspection')
}
</script>
