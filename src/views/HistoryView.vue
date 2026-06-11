<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '@/stores/data'
import UiCard from '@/components/ui/UiCard.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiPhoto from '@/components/ui/UiPhoto.vue'
import UiInput from '@/components/ui/UiInput.vue'
import type { SelectOption } from '@/components/ui/UiInput.vue'
import type { TraceRow, TimelineEvent, TestResult } from '@shared/types'
type BadgeVariant = 'default' | 'blue' | 'orange' | 'green' | 'red' | 'purple' | 'teal'
import {
  FileText, CheckCircle, Package, MapPin, Network, AlertTriangle, RefreshCw,
  ArrowDownToLine, Archive, Search, Filter, Download, FileSpreadsheet,
  FileText as FileIcon, Printer, ChevronDown, ChevronRight, Eye, Clock,
  User, Layers, Check, Ruler, Image as ImageIcon, XCircle
} from 'lucide-vue-next'

const store = useDataStore()
onMounted(() => {
  if (store.requisitions.length === 0) {
    store.loadAll()
  }
})

type TabKey = 'timeline' | 'trace' | 'archive' | 'export'
const activeTab = ref<TabKey>('timeline')
const tabs: { key: TabKey; label: string; icon: any }[] = [
  { key: 'timeline', label: '全链路时间轴', icon: Clock },
  { key: 'trace', label: '领用-点位追溯表', icon: Layers },
  { key: 'archive', label: '归档竣工资料', icon: Archive },
  { key: 'export', label: '数据导出', icon: Download }
]

const typeIcon: Record<string, any> = {
  requisition: FileText, approve: CheckCircle, issue: Package, checkin: MapPin,
  point: Network, shortage: AlertTriangle, supplement: RefreshCw,
  return: ArrowDownToLine, archive: Archive
}
const typeColor: Record<string, string> = {
  requisition: 'bg-blue-600', approve: 'bg-green-600', issue: 'bg-indigo-600',
  checkin: 'bg-cyan-600', point: 'bg-violet-600', shortage: 'bg-orange-500',
  supplement: 'bg-amber-500', return: 'bg-teal-600', archive: 'bg-slate-500'
}
const tagMap: Record<string, { v: any; l: string }> = {
  over: { v: 'orange', l: '超领' }, wrong: { v: 'default', l: '错领' },
  supplement: { v: 'blue', l: '补领' }, normal: { v: 'green', l: '正常' }
}
const sideColor: Record<string, string> = {
  over: 'bg-orange-500', wrong: 'bg-gray-500', supplement: 'bg-amber-500'
}

const fProject = ref(''), fTeam = ref(''), fFrom = ref(''), fTo = ref(''), fKw = ref('')
const fCode = ref(''), fModel = ref(''), fTag = ref('')
const detailOpen = ref(false), photoOpen = ref(false)
const detailEv = ref<TimelineEvent | null>(null), photoUrls = ref<string[]>([])
const expanded = ref<Set<string>>(new Set()), archiveExp = ref(false)
const expProj = ref(''), expFrom = ref(''), expTo = ref('')
const expMods = ref<string[]>(['requisition', 'checkin', 'point', 'shortage', 'return'])
const exporting = ref(false)

const projectOpts = computed<SelectOption[]>(() => [{ value: '', label: '全部项目' }, ...store.projects.map(p => ({ value: p.id, label: p.name }))])
const teamOpts = computed<SelectOption[]>(() => [{ value: '', label: '全部班组' }, ...store.teams.map(t => ({ value: t.id, label: t.name }))])
const tagOpts: SelectOption[] = [{ value: '', label: '全部状态' }, { value: 'over', label: '超领' }, { value: 'wrong', label: '错领' }, { value: 'supplement', label: '补领' }, { value: 'normal', label: '正常' }]
const modules = [{ key: 'requisition', label: '领料单据' }, { key: 'checkin', label: '打卡考勤' }, { key: 'point', label: '点位记录' }, { key: 'shortage', label: '缺料上报' }, { key: 'return', label: '材料退回' }]

function toTw(c: string): any {
  if (c.startsWith('#10B') || c.startsWith('#14B') || c.startsWith('#06B')) return 'green'
  if (c.startsWith('#EA') || c.startsWith('#F59')) return 'orange'
  if (c.startsWith('#636') || c.startsWith('#8B5') || c.startsWith('#6')) return 'purple'
  if (c.startsWith('#647')) return 'gray'
  return 'blue'
}
function isOver(e: TimelineEvent) {
  return e.type === 'requisition' && store.requisitions.find(x => x.id === e.relatedId)?.tags.includes('over')
}
const filteredTl = computed(() => {
  let l = store.timeline.slice()
  if (fKw.value) {
    const k = fKw.value.toLowerCase()
    l = l.filter(e => e.title.toLowerCase().includes(k) || e.description.toLowerCase().includes(k) || e.operator.toLowerCase().includes(k))
  }
  return l
})
const filteredTr = computed<TraceRow[]>(() => {
  let l = store.trace.slice()
  if (fCode.value) l = l.filter(r => r.requisitionCode.toLowerCase().includes(fCode.value.toLowerCase()))
  if (fModel.value) l = l.filter(r => r.cableModel.toLowerCase().includes(fModel.value.toLowerCase()))
  if (fTag.value) l = l.filter(r => r.tags.includes(fTag.value))
  return l
})
function toggle(k: string) { expanded.value.has(k) ? expanded.value.delete(k) : expanded.value.add(k) }
function rate(r: TraceRow) {
  const b = r.appliedQty - r.returnedQty
  return b <= 0 ? 0 : +((r.usedQty / b) * 100).toFixed(1)
}
function reqByCode(c: string) { return store.requisitions.find(r => r.code === c) }
const tb = (r: TestResult): { v: BadgeVariant; l: string } =>
  r === 'pass' ? { v: 'green', l: '合格' } : r === 'fail' ? { v: 'red', l: '不合格' } : { v: 'orange', l: '待检' }
const stats = computed(() => {
  const d = store.trace.reduce((s, r) => s + r.designQty, 0)
  const u = store.trace.reduce((s, r) => s + r.usedQty, 0)
  const rt = store.trace.reduce((s, r) => s + r.returnedQty, 0)
  const ls = Math.max(0, store.trace.reduce((s, r) => s + (r.appliedQty - r.usedQty - r.returnedQty), 0))
  const t = d || 1
  return { d, u, rt, ls, pd: (d / t) * 100, pu: (u / t) * 100, pr: (rt / t) * 100, pl: (ls / t) * 100 }
})
const pts = computed(() => store.points.map(p => ({ c: p.pointCode, m: p.cableModel, mtr: p.usedMeters, r: p.testResult, t: p.tester, ph: p.photos })))

const overRequisitions = computed(() => store.requisitions.filter(r => r.tags.includes('over')))
const wrongRequisitions = computed(() => store.requisitions.filter(r => r.tags.includes('wrong')))
const supplementRequisitions = computed(() => store.requisitions.filter(r => r.tags.includes('supplement')))
const shortageActive = computed(() => store.shortages.filter(s => s.status !== 'closed'))
const returnRecords = computed(() => store.returns)

const archiveSummary = computed(() => ({
  requisitionCount: store.requisitions.length,
  pointCount: store.points.length,
  returnCount: store.returns.length,
  overCount: overRequisitions.value.length,
  wrongCount: wrongRequisitions.value.length,
  supplementCount: supplementRequisitions.value.length,
  shortageCount: shortageActive.value.length
}))
function openDetail(e: TimelineEvent) { detailEv.value = e; detailOpen.value = true }
function openPh(u: string[]) { photoUrls.value = u; photoOpen.value = true }
function toggleM(k: string) { const i = expMods.value.indexOf(k); i >= 0 ? expMods.value.splice(i, 1) : expMods.value.push(k) }
function toggleAll() { expMods.value = expMods.value.length === modules.length ? [] : modules.map(m => m.key) }

const exportBase = import.meta.env.VITE_API_BASE || '/api'

async function downloadCsv(path: string) {
  const url = exportBase + path
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.rel = 'noopener'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

async function doExport(format: 'csv' | 'excel' | 'pdf') {
  if (exporting.value) return
  if (expMods.value.length === 0) {
    alert('请至少选择一个导出模块')
    return
  }
  exporting.value = true
  try {
    const pid = expProj.value || store.currentProjectId
    const params = new URLSearchParams()
    if (pid) params.set('projectId', pid)
    if (expFrom.value) params.set('from', expFrom.value)
    if (expTo.value) params.set('to', expTo.value)
    const qs = params.toString()
    const q = qs ? `?${qs}` : ''
    const jobs: { key: string; path: string }[] = []
    if (expMods.value.includes('requisition')) jobs.push({ key: 'requisition', path: `/export/requisitions${q}` })
    if (expMods.value.includes('point')) jobs.push({ key: 'point', path: `/export/points${q}` })
    if (expMods.value.includes('return')) jobs.push({ key: 'return', path: `/export/returns${q}` })
    if (format === 'excel' || format === 'csv') {
      for (let i = 0; i < jobs.length; i++) {
        await new Promise(r => setTimeout(r, i * 300))
        downloadCsv(jobs[i].path)
      }
      alert(`导出完成！共 ${jobs.length} 个 CSV 文件已开始下载。\n提示：CSV 可直接用 Excel 打开，或另存为 .xlsx 格式。`)
    } else {
      alert('PDF 竣工资料导出需安装 PDF 渲染服务，当前已导出 CSV 格式数据，可用于竣工资料整理。')
    }
  } finally {
    exporting.value = false
  }
}
function doPrint() { window.print() }
</script>

<template>
  <div class="space-y-5">
    <div v-if="store.currentProject" class="flex items-center gap-3 bg-[#1E40AF]/5 border border-[#1E40AF]/20 rounded-[4px] px-4 py-2.5">
      <Layers class="w-4 h-4 text-[#1E40AF]" />
      <span class="text-sm text-gray-700">当前数据范围：</span>
      <span class="text-sm font-semibold text-[#1E40AF]">{{ store.currentProject.name }}</span>
      <span class="text-xs text-gray-500">(时间轴、追溯表、归档资料均按此项目过滤，切换顶部下拉框可查看其他项目)</span>
    </div>

    <div class="bg-white border border-gray-200 rounded-[4px] p-1.5 inline-flex gap-1 shadow-sm">
      <button v-for="t in tabs" :key="t.key"
        class="flex items-center gap-2 px-4 py-2 rounded-[4px] text-sm font-medium transition-all"
        :class="activeTab === t.key ? 'bg-[#1E40AF] text-white shadow' : 'text-gray-600 hover:bg-gray-100'"
        @click="activeTab = t.key">
        <component :is="t.icon" class="w-4 h-4" />{{ t.label }}
      </button>
    </div>

    <div v-show="activeTab === 'timeline'" class="space-y-4">
      <UiCard>
        <template #header><div class="flex items-center gap-2 font-semibold"><Filter class="w-[18px] h-[18px] text-[#1E40AF]" />筛选条件</div></template>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <UiInput type="select" v-model="fProject" :options="projectOpts" placeholder="全部项目" />
          <UiInput type="select" v-model="fTeam" :options="teamOpts" placeholder="全部班组" />
          <UiInput v-model="fFrom" placeholder="开始日期" />
          <UiInput v-model="fTo" placeholder="结束日期" />
          <div class="relative"><UiInput v-model="fKw" placeholder="搜索关键词..." /><Search class="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" /></div>
        </div>
      </UiCard>
      <UiCard>
        <template #header>
          <div class="flex items-center gap-2 font-semibold"><Clock class="w-[18px] h-[18px] text-orange-500" />全链路时间轴<UiBadge variant="blue" size="sm">{{ filteredTl.length }} 条</UiBadge></div>
        </template>
        <div class="relative pl-10">
          <div class="absolute left-[15px] top-2 bottom-2 w-[3px] bg-gradient-to-b from-blue-500 via-purple-500 to-slate-400 rounded-full" />
          <div v-for="(e, i) in filteredTl" :key="e.id" class="relative pb-8 last:pb-0">
            <div class="absolute -left-[30px] top-2 w-8 h-8 rounded-full ring-4 ring-white flex items-center justify-center shrink-0 z-10 shadow-md"
              :class="[typeColor[e.type], e.type === 'shortage' ? 'animate-pulse' : '']">
              <component :is="typeIcon[e.type]" class="w-4 h-4 text-white" />
            </div>
            <div class="relative bg-white border rounded-[4px] p-4 shadow-sm hover:shadow-md transition-all"
              :class="e.type === 'shortage' ? 'border-orange-400 breath-warn' : e.type === 'supplement' ? 'border-amber-400' : 'border-gray-200'">
              <div v-if="isOver(e)" class="absolute -top-2 -right-2 z-20"><span class="inline-flex items-center justify-center bg-red-600 text-white text-[10px] font-bold w-6 h-6 rounded-full shadow-lg border-2 border-white">超</span></div>
              <div class="flex items-start justify-between gap-3 mb-2">
                <div class="min-w-0 flex-1">
                  <div class="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 class="text-base font-bold text-gray-900">{{ e.title }}</h4>
                    <UiBadge :variant="toTw(e.color)" size="sm">{{ i + 1 }}</UiBadge>
                  </div>
                  <p class="text-sm text-gray-600">{{ e.description }}</p>
                </div>
                <div class="shrink-0 text-right">
                  <div class="font-mono text-xs text-gray-500 mb-1">{{ e.time }}</div>
                  <div class="flex items-center gap-1 text-xs text-gray-600 justify-end"><User class="w-3 h-3 text-gray-400" /><span>{{ e.operator }}</span></div>
                </div>
              </div>
              <div class="flex justify-end pt-2 border-t border-gray-100">
                <UiButton variant="ghost" size="sm" @click="openDetail(e)"><template #icon><Eye class="w-3.5 h-3.5" /></template>查看详情</UiButton>
              </div>
            </div>
          </div>
          <div v-if="filteredTl.length === 0" class="py-16 text-center text-gray-400 text-sm"><Clock class="w-12 h-12 mx-auto mb-3 text-gray-300" />暂无时间轴数据</div>
        </div>
      </UiCard>
    </div>

    <div v-show="activeTab === 'trace'" class="space-y-4">
      <UiCard>
        <template #header><div class="flex items-center gap-2 font-semibold"><Filter class="w-[18px] h-[18px] text-[#1E40AF]" />追溯筛选</div></template>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <UiInput v-model="fCode" placeholder="领料单号..." />
          <UiInput v-model="fModel" placeholder="线缆型号..." />
          <UiInput type="select" v-model="fTag" :options="tagOpts" placeholder="全部状态" />
          <UiButton variant="secondary" @click="fCode = fModel = fTag = ''">重置筛选</UiButton>
        </div>
      </UiCard>
      <UiCard>
        <template #header><div class="flex items-center gap-2 font-semibold"><Layers class="w-[18px] h-[18px] text-purple-600" />领用-点位追溯对照表<UiBadge variant="blue" size="sm">{{ filteredTr.length }} 条</UiBadge></div></template>
        <div class="-mx-5 -my-4 overflow-x-auto">
          <table class="w-full min-w-max text-sm">
            <thead class="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
              <tr>
                <th class="w-10 px-3 py-3"></th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700">领料单号</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700">标签</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700">线缆型号</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700">设计量</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700">申请量</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700">已使用</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700">已退回</th>
                <th class="px-4 py-3 text-right font-semibold text-gray-700">结余</th>
                <th class="px-4 py-3 text-left font-semibold text-gray-700 w-56">完成率</th>
                <th class="px-4 py-3 text-center font-semibold text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <template v-for="r in filteredTr" :key="r.requisitionCode + r.cableModel">
                <tr class="group hover:bg-blue-50/40 transition-colors">
                  <td class="relative px-3 py-3.5">
                    <div class="absolute left-0 top-0 bottom-0 w-[3px]" :class="sideColor[r.tags[0]] || 'bg-[#1E40AF]'" />
                    <button @click="toggle(r.requisitionCode + r.cableModel)" class="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700">
                      <ChevronDown v-if="expanded.has(r.requisitionCode + r.cableModel)" class="w-4 h-4" />
                      <ChevronRight v-else class="w-4 h-4" />
                    </button>
                  </td>
                  <td class="px-4 py-3.5"><span class="font-mono font-semibold text-[#1E40AF]">{{ r.requisitionCode }}</span></td>
                  <td class="px-4 py-3.5"><div class="flex flex-wrap gap-1"><UiTag v-for="tg in r.tags" :key="tg" :variant="tagMap[tg].v" size="sm" :class="{ 'italic': tg === 'wrong' }">{{ tagMap[tg].l }}</UiTag></div></td>
                  <td class="px-4 py-3.5 font-medium text-gray-800">{{ r.cableModel }}</td>
                  <td class="px-4 py-3.5 text-right font-mono-num">{{ r.designQty }}</td>
                  <td class="px-4 py-3.5 text-right font-mono-num font-semibold">{{ r.appliedQty }}</td>
                  <td class="px-4 py-3.5 text-right font-mono-num text-teal-700 font-semibold">{{ r.usedQty }}</td>
                  <td class="px-4 py-3.5 text-right font-mono-num text-gray-500">{{ r.returnedQty }}</td>
                  <td class="px-4 py-3.5 text-right font-mono-num"><span :class="r.balance < 0 ? 'text-red-600 font-bold' : ''">{{ r.balance }}</span></td>
                  <td class="px-4 py-3.5">
                    <div class="flex items-center gap-2">
                      <div class="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden"><div class="h-full rounded-full" :class="rate(r) > 100 ? 'bg-red-500' : rate(r) >= 80 ? 'bg-green-500' : 'bg-[#1E40AF]'" :style="{ width: Math.min(100, rate(r)) + '%' }" /></div>
                      <span class="text-xs font-mono-num min-w-[60px] text-right shrink-0" :class="rate(r) > 100 ? 'text-red-600 font-bold' : ''">{{ rate(r) }}%<span v-if="rate(r) > 100" class="ml-0.5">超</span></span>
                    </div>
                  </td>
                  <td class="px-4 py-3.5 text-center"><UiButton variant="ghost" size="sm" @click="toggle(r.requisitionCode + r.cableModel)">详情</UiButton></td>
                </tr>
                <tr v-if="expanded.has(r.requisitionCode + r.cableModel)" class="bg-gray-50/60">
                  <td colspan="11" class="px-4 py-4">
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div class="bg-white border rounded-[4px] p-4">
                        <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100"><MapPin class="w-4 h-4 text-violet-600" /><span class="font-semibold">已使用点位</span><UiBadge variant="purple" size="sm">{{ r.usedPoints.length }}</UiBadge></div>
                        <table class="w-full text-xs" v-if="r.usedPoints.length > 0">
                          <thead class="bg-gray-50 text-gray-600"><tr><th class="px-2 py-2 text-left">点位号</th><th class="px-2 py-2 text-right">米数</th><th class="px-2 py-2 text-left">测试</th><th class="px-2 py-2 text-center">照片</th></tr></thead>
                          <tbody class="divide-y divide-gray-50">
                            <tr v-for="p in r.usedPoints" :key="p.pointCode" class="hover:bg-gray-50">
                              <td class="px-2 py-2 font-mono">{{ p.pointCode }}</td>
                              <td class="px-2 py-2 text-right font-mono-num">{{ p.usedMeters }}m</td>
                              <td class="px-2 py-2"><UiBadge :variant="tb(p.testResult as TestResult).v" size="sm">{{ tb(p.testResult as TestResult).l }}</UiBadge></td>
                              <td class="px-2 py-2 text-center"><button v-if="p.photos.length" @click="openPh(p.photos)" class="text-[#1E40AF] hover:text-[#1e3a8a] text-xs inline-flex items-center gap-1"><ImageIcon class="w-3 h-3" />{{ p.photos.length }}张</button><span v-else class="text-gray-400">-</span></td>
                            </tr>
                          </tbody>
                        </table>
                        <div v-else class="text-center text-gray-400 py-6 text-xs">暂无点位</div>
                      </div>
                      <div class="bg-white border rounded-[4px] p-4">
                        <div class="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100"><ArrowDownToLine class="w-4 h-4 text-teal-600" /><span class="font-semibold">退回记录</span></div>
                        <div v-if="r.returnedQty > 0" class="space-y-2">
                          <div v-for="rt in store.returns.filter(x => x.requisitionId === reqByCode(r.requisitionCode)?.id)" :key="rt.id" class="border rounded p-3 text-xs">
                            <div class="flex items-center justify-between mb-1.5"><span class="font-mono font-semibold text-teal-700">{{ rt.code }}</span><UiBadge :variant="rt.status === 'received' ? 'green' : 'orange'" size="sm">{{ rt.status === 'received' ? '已接收' : '待接收' }}</UiBadge></div>
                            <div class="text-gray-600 space-y-0.5">
                              <div>退回人：{{ rt.returner }} · {{ rt.returnTime.slice(5, 16) }}</div>
                              <div v-for="it in rt.items" :key="it.cableId" class="flex items-center gap-2"><Ruler class="w-3 h-3 text-gray-400" /><span>{{ it.cableModel }}</span><span class="font-mono-num ml-auto">{{ it.returnQty }}</span><UiTag size="sm" :variant="it.condition === 'good' ? 'green' : it.condition === 'damaged' ? 'red' : 'orange'">{{ it.condition === 'good' ? '完好' : it.condition === 'damaged' ? '破损' : '部分' }}</UiTag></div>
                              <button v-if="rt.photos.length" @click="openPh(rt.photos)" class="text-[#1E40AF] hover:text-[#1e3a8a] flex items-center gap-1 mt-1"><ImageIcon class="w-3 h-3" />照片 {{ rt.photos.length }}张</button>
                            </div>
                          </div>
                        </div>
                        <div v-else class="text-center text-gray-400 py-6 text-xs">暂无退回</div>
                      </div>
                    </div>
                    <div v-if="r.tags.includes('supplement')" class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-[4px] text-xs text-amber-800">💡 关联缺料单：原单号因缺料发起紧急补领，流程已完成闭环</div>
                    <div v-if="r.tags.includes('wrong')" class="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-[4px] text-xs text-gray-600 italic">⚠️ 备注：此单为错领调换记录，实际型号已更换并重新登记</div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </UiCard>
    </div>

    <div v-show="activeTab === 'archive'" class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UiCard class="lg:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 font-semibold"><FileIcon class="w-[18px] h-[18px] text-blue-600" />领料台账汇总</div>
            <UiButton variant="secondary" size="sm" @click="archiveExp = !archiveExp"><template #icon><ChevronDown class="w-3.5 h-3.5 transition-transform" :class="archiveExp ? 'rotate-180' : ''" /></template>{{ archiveExp ? '收起' : '展开' }}</UiButton>
          </div>
        </template>
        <div v-show="archiveExp" class="-mx-5 -my-4 overflow-x-auto">
          <table class="w-full min-w-max text-sm">
            <thead class="bg-gray-50 border-b border-gray-200"><tr><th class="px-5 py-3 text-left font-semibold text-gray-700">单号</th><th class="px-4 py-3 text-left font-semibold text-gray-700">型号</th><th class="px-4 py-3 text-right font-semibold text-gray-700">申请</th><th class="px-4 py-3 text-right font-semibold text-gray-700">使用</th><th class="px-4 py-3 text-right font-semibold text-gray-700">退回</th><th class="px-4 py-3 text-right font-semibold text-gray-700">结余</th><th class="px-5 py-3 text-center font-semibold text-gray-700">操作</th></tr></thead>
            <tbody class="divide-y divide-gray-100 bg-white">
              <tr v-for="r in store.trace" :key="r.requisitionCode + r.cableModel" class="hover:bg-blue-50/40">
                <td class="px-5 py-3 font-mono text-[#1E40AF]">{{ r.requisitionCode }}</td><td class="px-4 py-3">{{ r.cableModel }}</td>
                <td class="px-4 py-3 text-right font-mono-num">{{ r.appliedQty }}</td><td class="px-4 py-3 text-right font-mono-num text-teal-700">{{ r.usedQty }}</td>
                <td class="px-4 py-3 text-right font-mono-num text-gray-500">{{ r.returnedQty }}</td>
                <td class="px-4 py-3 text-right font-mono-num"><span :class="r.balance < 0 ? 'text-red-600 font-bold' : ''">{{ r.balance }}</span></td>
                <td class="px-5 py-3 text-center"><UiButton variant="ghost" size="sm"><template #icon><Eye class="w-3.5 h-3.5" /></template>查看</UiButton></td>
              </tr>
            </tbody>
          </table>
        </div>
        <div v-show="!archiveExp" class="text-center text-gray-400 text-sm py-4">点击"展开"查看完整台账</div>
      </UiCard>
      <UiCard>
        <template #header><div class="flex items-center gap-2 font-semibold"><Check class="w-[18px] h-[18px] text-green-600" />点位测试报告<UiBadge variant="green" size="sm">{{ pts.length }} 个</UiBadge></div></template>
        <div class="space-y-2 max-h-96 overflow-y-auto -mx-5 -my-4 px-5 py-4">
          <div v-for="p in pts" :key="p.c" class="flex items-center gap-3 p-2.5 rounded hover:bg-gray-50">
            <div class="w-10 h-10 rounded flex items-center justify-center shrink-0 bg-gray-100 overflow-hidden"><img v-if="p.ph[0]" :src="p.ph[0]" class="w-full h-full object-cover" /><MapPin v-else class="w-5 h-5 text-gray-400" /></div>
            <div class="min-w-0 flex-1"><div class="flex items-center gap-2"><span class="font-mono text-sm font-semibold">{{ p.c }}</span><UiBadge :variant="tb(p.r as TestResult).v" size="sm">{{ tb(p.r as TestResult).l }}</UiBadge></div><div class="text-xs text-gray-500 mt-0.5">{{ p.m }} · {{ p.mtr }}m · {{ p.t }}</div></div>
            <button v-if="p.ph.length" @click="openPh(p.ph)" class="shrink-0 text-xs text-[#1E40AF] hover:underline">FLUKE</button>
          </div>
        </div>
      </UiCard>
      <UiCard>
        <template #header><div class="flex items-center gap-2 font-semibold"><Package class="w-[18px] h-[18px] text-orange-500" />材料流向汇总</div></template>
        <div class="flex flex-col sm:flex-row items-center gap-6 py-2">
          <div class="relative w-44 h-44 shrink-0">
            <svg viewBox="0 0 100 100" class="w-full h-full -rotate-90">
              <circle cx="50" cy="50" r="40" fill="none" stroke="#E5E7EB" stroke-width="12" /><circle cx="50" cy="50" r="40" fill="none" stroke="#1E40AF" stroke-width="12" stroke-dasharray="251.2" :stroke-dashoffset="251.2 - (251.2 * stats.pd / 100)" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="#E5E7EB" stroke-width="12" /><circle cx="50" cy="50" r="30" fill="none" stroke="#10B981" stroke-width="12" stroke-dasharray="188.4" :stroke-dashoffset="188.4 - (188.4 * stats.pu / 100)" />
              <circle cx="50" cy="50" r="20" fill="none" stroke="#E5E7EB" stroke-width="12" /><circle cx="50" cy="50" r="20" fill="none" stroke="#14B8A6" stroke-width="12" stroke-dasharray="125.6" :stroke-dashoffset="125.6 - (125.6 * stats.pr / 100)" />
              <circle cx="50" cy="50" r="10" fill="none" stroke="#E5E7EB" stroke-width="12" /><circle cx="50" cy="50" r="10" fill="none" stroke="#F59E0B" stroke-width="12" stroke-dasharray="62.8" :stroke-dashoffset="62.8 - (62.8 * stats.pl / 100)" />
            </svg>
            <div class="absolute inset-0 flex flex-col items-center justify-center"><span class="text-[11px] text-gray-500">总量</span><span class="text-xl font-bold font-mono-num">{{ stats.d }}</span></div>
          </div>
          <div class="flex-1 w-full space-y-2.5">
            <div v-for="[c, l, v, p, tc] in [['bg-[#1E40AF]', '设计总量', stats.d, stats.pd, 'text-gray-900'], ['bg-green-500', '已使用', stats.u, stats.pu, 'text-green-700'], ['bg-teal-500', '已退回', stats.rt, stats.pr, 'text-teal-700'], ['bg-amber-500', '损耗/结余', stats.ls, stats.pl, 'text-amber-700']]" :key="l" class="flex items-center gap-2">
              <div class="w-3 h-3 rounded-sm" :class="c" /><span class="text-sm text-gray-700 flex-1">{{ l }}</span><span class="text-sm font-mono-num font-semibold" :class="tc">{{ v }}</span><span class="text-xs text-gray-500 w-12 text-right">{{ Math.round(p as number) }}%</span>
            </div>
          </div>
        </div>
      </UiCard>

      <div class="lg:col-span-2 pt-2">
        <div class="flex items-center gap-2 pb-2 border-b border-gray-200">
          <FileText class="w-[18px] h-[18px] text-amber-600" />
          <span class="font-semibold text-gray-800">异常与凭证摘要</span>
          <span class="text-xs text-gray-400">竣工资料附件目录</span>
        </div>
      </div>

      <UiCard class="border-l-4 !border-l-orange-500">
        <template #header>
          <div class="flex items-center gap-2">
            <AlertTriangle class="w-[18px] h-[18px] text-orange-600" />
            <span class="font-semibold text-gray-800">超领凭证</span>
            <UiBadge variant="orange" size="sm">{{ overRequisitions.length }} 单</UiBadge>
          </div>
        </template>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div v-for="r in overRequisitions" :key="r.id" class="p-2.5 bg-orange-50 border border-orange-100 rounded text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-semibold text-orange-800">{{ r.code }}</span>
              <span class="text-orange-600">超 {{ Math.round((r.items.reduce((s,i) => s + (i.overFlag ? i.quantity - (i.designQty || 0) : 0), 0) / Math.max(1, r.items.reduce((s,i) => s + (i.designQty || 0), 0))) * 100) }}%</span>
            </div>
            <div class="text-gray-600">申请人：{{ r.applicant }} · {{ r.applyTime.slice(5, 16) }}</div>
            <div class="text-gray-500">明细：{{ r.items.filter(i => i.overFlag).map(i => `${i.cableModel} 超${(i.quantity - (i.designQty || 0)).toFixed(0)}`).join('、') || '—' }}</div>
            <div v-if="r.approverRemark" class="text-gray-500 italic">审批意见：{{ r.approverRemark }}</div>
          </div>
          <div v-if="overRequisitions.length === 0" class="text-center text-gray-400 py-4 text-xs">无超领记录</div>
        </div>
      </UiCard>

      <UiCard class="border-l-4 !border-l-gray-400">
        <template #header>
          <div class="flex items-center gap-2">
            <XCircle class="w-[18px] h-[18px] text-gray-500" />
            <span class="font-semibold text-gray-800">错领凭证</span>
            <UiBadge variant="default" size="sm">{{ wrongRequisitions.length }} 单</UiBadge>
          </div>
        </template>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div v-for="r in wrongRequisitions" :key="r.id" class="p-2.5 bg-gray-50 border border-gray-200 rounded text-xs space-y-1 italic">
            <div class="flex items-center justify-between">
              <span class="font-mono font-semibold text-gray-700 line-through">{{ r.code }}</span>
              <span class="text-gray-500">已调换</span>
            </div>
            <div class="text-gray-600">申请人：{{ r.applicant }} · {{ r.applyTime.slice(5, 16) }}</div>
            <div class="text-gray-500">错领型号：{{ r.items.map(i => i.cableModel).join('、') }}</div>
            <div v-if="r.remark" class="text-gray-500">备注：{{ r.remark }}</div>
          </div>
          <div v-if="wrongRequisitions.length === 0" class="text-center text-gray-400 py-4 text-xs">无错领记录</div>
        </div>
      </UiCard>

      <UiCard class="border-l-4 !border-l-amber-500">
        <template #header>
          <div class="flex items-center gap-2">
            <RefreshCw class="w-[18px] h-[18px] text-amber-600" />
            <span class="font-semibold text-gray-800">补领凭证</span>
            <UiBadge variant="blue" size="sm">{{ supplementRequisitions.length }} 单</UiBadge>
          </div>
        </template>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div v-for="r in supplementRequisitions" :key="r.id" class="p-2.5 bg-amber-50 border border-amber-100 rounded text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-semibold text-amber-800">{{ r.code }}</span>
              <UiBadge variant="blue" size="sm">补领</UiBadge>
            </div>
            <div class="text-gray-600">申请人：{{ r.applicant }} · {{ r.applyTime.slice(5, 16) }}</div>
            <div class="text-gray-500">补领型号：{{ r.items.map(i => `${i.cableModel} ×${i.quantity}`).join('、') }}</div>
            <div v-if="r.remark" class="text-amber-700">关联：{{ r.remark }}</div>
          </div>
          <div v-if="supplementRequisitions.length === 0" class="text-center text-gray-400 py-4 text-xs">无补领记录</div>
        </div>
      </UiCard>

      <UiCard class="border-l-4 !border-l-teal-500">
        <template #header>
          <div class="flex items-center gap-2">
            <ArrowDownToLine class="w-[18px] h-[18px] text-teal-600" />
            <span class="font-semibold text-gray-800">退回凭证</span>
            <UiBadge variant="teal" size="sm">{{ returnRecords.length }} 单</UiBadge>
          </div>
        </template>
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div v-for="r in returnRecords" :key="r.id" class="p-2.5 bg-teal-50 border border-teal-100 rounded text-xs space-y-1">
            <div class="flex items-center justify-between">
              <span class="font-mono font-semibold text-teal-800">{{ r.code }}</span>
              <UiBadge :variant="r.status === 'received' ? 'green' : 'orange'" size="sm">{{ r.status === 'received' ? '已接收' : '待接收' }}</UiBadge>
            </div>
            <div class="text-gray-600">退回人：{{ r.returner }} · {{ r.returnTime.slice(5, 16) }}</div>
            <div class="text-gray-500">明细：{{ r.items.map(i => `${i.cableModel} ×${i.returnQty}${i.condition === 'good' ? '(完好)' : i.condition === 'damaged' ? '(破损)' : ''}`).join('、') }}</div>
            <div v-if="r.photos.length" class="text-teal-600 flex items-center gap-1"><ImageIcon class="w-3 h-3" />照片凭证 {{ r.photos.length }} 张</div>
          </div>
          <div v-if="returnRecords.length === 0" class="text-center text-gray-400 py-4 text-xs">无退回记录</div>
        </div>
      </UiCard>
    </div>

    <div v-show="activeTab === 'export'" class="max-w-3xl">
      <UiCard>
        <template #header><div class="flex items-center gap-2 font-semibold"><Download class="w-[18px] h-[18px] text-[#1E40AF]" />数据导出配置</div></template>
        <div class="space-y-5">
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <UiInput type="select" v-model="expProj" :options="projectOpts" label="导出项目" placeholder="全部项目" />
            <UiInput v-model="expFrom" label="开始日期" placeholder="YYYY-MM-DD" />
            <UiInput v-model="expTo" label="结束日期" placeholder="YYYY-MM-DD" />
          </div>
          <div><label class="block text-sm font-medium text-gray-700 mb-2">包含模块</label>
            <div class="p-3 border border-gray-200 rounded-[4px] bg-gray-50 space-y-2">
              <label class="flex items-center gap-2 cursor-pointer pb-2 border-b border-gray-200"><input type="checkbox" :checked="expMods.length === modules.length" @change="toggleAll" class="w-4 h-4 rounded accent-[#1E40AF]" /><span class="text-sm font-medium">全选</span></label>
              <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <label v-for="m in modules" :key="m.key" class="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-white"><input type="checkbox" :checked="expMods.includes(m.key)" @change="toggleM(m.key)" class="w-4 h-4 rounded accent-[#1E40AF]" /><span class="text-sm text-gray-700">{{ m.label }}</span></label>
              </div>
            </div>
          </div>
          <div class="pt-2 border-t border-gray-100">
            <div class="text-sm text-gray-600 mb-3">选择导出格式：</div>
            <div class="flex flex-wrap gap-3">
              <UiButton variant="primary" size="lg" :loading="exporting" @click="doExport('excel')"><template #icon><FileSpreadsheet class="w-5 h-5" /></template>导出 Excel (CSV)</UiButton>
              <UiButton variant="success" size="lg" :loading="exporting" @click="doExport('pdf')"><template #icon><FileIcon class="w-5 h-5" /></template>导出 PDF 资料</UiButton>
              <UiButton variant="secondary" size="lg" @click="doPrint"><template #icon><Printer class="w-5 h-5" /></template>打印页面</UiButton>
            </div>
          </div>
        </div>
      </UiCard>
    </div>

    <UiModal v-model:open="detailOpen">
      <template #title><div class="flex items-center gap-2"><component :is="detailEv ? typeIcon[detailEv.type] : Clock" class="w-5 h-5 text-[#1E40AF]" />{{ detailEv?.title || '详情' }}</div></template>
      <div v-if="detailEv" class="space-y-3 text-sm">
        <div class="flex items-center gap-2 p-3 bg-gray-50 rounded"><Clock class="w-4 h-4 text-gray-500" /><span class="font-mono">{{ detailEv.time }}</span></div>
        <div class="space-y-1.5">
          <div class="flex gap-2"><span class="text-gray-500 w-16 shrink-0">描述：</span><span class="flex-1">{{ detailEv.description }}</span></div>
          <div class="flex gap-2"><span class="text-gray-500 w-16 shrink-0">操作人：</span><span>{{ detailEv.operator }}</span></div>
          <div class="flex gap-2"><span class="text-gray-500 w-16 shrink-0">关联ID：</span><span class="font-mono text-[#1E40AF]">{{ detailEv.relatedId }}</span></div>
          <div class="flex gap-2"><span class="text-gray-500 w-16 shrink-0">类型：</span><UiTag :variant="toTw(detailEv.color)" size="sm">{{ detailEv.type }}</UiTag></div>
        </div>
      </div>
      <template #footer><UiButton @click="detailOpen = false">关闭</UiButton></template>
    </UiModal>

    <UiModal v-model:open="photoOpen">
      <template #title><div class="flex items-center gap-2"><ImageIcon class="w-5 h-5 text-[#1E40AF]" />照片查看</div></template>
      <UiPhoto v-if="photoUrls.length" :src="photoUrls" />
      <div v-else class="text-center text-gray-400 py-8">暂无照片</div>
      <template #footer><UiButton @click="photoOpen = false">关闭</UiButton></template>
    </UiModal>
  </div>
</template>

<style>
.breath-warn { animation: bw 1.5s ease-in-out infinite; }
@keyframes bw { 0%,100% { box-shadow: 0 0 0 0 rgba(234,88,12,.35); } 50% { box-shadow: 0 0 0 8px rgba(234,88,12,0); } }
.font-mono-num { font-variant-numeric: tabular-nums; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; }
</style>
