<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { Building2, Users, Package, AlertCircle, History, ChevronRight, Eye, Check, XCircle } from 'lucide-vue-next'
import { useDataStore } from '@/stores/data'
import UiCard from '@/components/ui/UiCard.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiButton from '@/components/ui/UiButton.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import type { TimelineItem } from '@/components/ui/UiTimeline.vue'
import type { CableType, Requisition, ReturnRecord, Shortage } from '@shared/types'

const router = useRouter()
const store = useDataStore()

const activeProjects = computed(() => store.projects.filter(p => p.status === 'active').length)

type CableUsage = { cable: CableType; designQty: number; issued: number; used: number; returned: number; remaining: number; completion: number; overPct: number }
const cableStats = computed<CableUsage[]>(() => {
  const map = new Map<string, CableUsage>()
  store.cables.forEach(c => map.set(c.id, { cable: c, designQty: c.designQty || 0, issued: 0, used: 0, returned: 0, remaining: 0, completion: 0, overPct: 0 }))
  const isIssued = (r: Requisition) => r.status === 'issued' || r.status === 'completed'
  store.requisitions.filter(isIssued).forEach(r => r.items.forEach(item => map.get(item.cableId) && (map.get(item.cableId)!.issued += item.quantity)))
  store.points.forEach(p => {
    const s = map.get(p.cableId); if (!s) return
    s.used += s.cable.unit.includes('卷') ? p.usedMeters / 305 : p.usedMeters
  })
  store.returns.filter(r => r.status === 'received').forEach(r => r.items.forEach(item => map.get(item.cableId) && (map.get(item.cableId)!.returned += item.returnQty)))
  map.forEach(s => {
    s.used = Math.round(s.used * 100) / 100
    s.remaining = s.designQty > 0 ? s.designQty - s.used : 0
    s.completion = s.designQty > 0 ? Math.min(100, Math.round((s.used / s.designQty) * 100)) : 0
    s.overPct = s.designQty > 0 && s.used > s.designQty ? Math.round(((s.used - s.designQty) / s.designQty) * 100) : 0
  })
  return Array.from(map.values())
})

const totalRolls = computed(() => {
  let n = 0, m = 0
  store.requisitions.filter(r => r.status === 'issued' || r.status === 'completed').forEach(r => r.items.forEach(item => {
    const c = store.cables.find(x => x.id === item.cableId); if (!c) return
    if (c.unit.includes('卷')) { n += item.quantity; m += item.quantity * 305 } else m += item.quantity
  }))
  return { rolls: n, meters: m }
})

const todoCount = computed(() => store.pendingRequisitions.length + store.pendingReturns.length + store.openShortages.filter(s => s.status === 'reported' || s.status === 'approved').length)

const statCards = computed(() => [
  { title: '在建项目数', value: activeProjects.value, sub: '个项目同步推进中', icon: Building2, border: 'border-l-[#1E40AF]', iconBg: 'bg-[#1E40AF]/10', iconColor: 'text-[#1E40AF]' },
  { title: '在线班组/本月签到', value: `${store.teams.length}/${store.checkins.length}`, sub: '条考勤记录', icon: Users, border: 'border-l-teal-600', iconBg: 'bg-teal-50', iconColor: 'text-teal-700' },
  { title: '本月线缆领用', value: `${totalRolls.value.rolls}卷`, sub: `合计 ${totalRolls.value.meters.toLocaleString()} 米`, icon: Package, border: 'border-l-orange-500', iconBg: 'bg-orange-50', iconColor: 'text-orange-600' },
  { title: '待办/待审批', value: todoCount.value, sub: '项需要处理', icon: AlertCircle, border: 'border-l-purple-600', iconBg: 'bg-purple-50', iconColor: 'text-purple-700' }
])

type TodoItem = { id: string; title: string; type: 'approve-requisition' | 'confirm-return' | 'handle-shortage'; time: string; tagVariant: 'orange' | 'red' | 'blue'; breath?: boolean; action: string }
const todoItems = computed<TodoItem[]>(() => {
  const list: TodoItem[] = []
  store.pendingRequisitions.forEach(r => {
    const isOver = r.tags.includes('over'), isSupplement = r.tags.includes('supplement')
    let title = `待审批-${r.code}`, breath = false
    if (isOver) {
      const it = r.items[0], pct = it && it.designQty ? Math.round(((it.quantity - it.designQty) / it.designQty) * 100) : 0
      title = `待审批-${r.code}-超领${pct}%`; breath = true
    } else if (isSupplement) title = `待审批-${r.code}-补领紧急`
    list.push({ id: `r-${r.id}`, title, type: 'approve-requisition', time: r.applyTime, tagVariant: 'orange', breath, action: '审批' })
  })
  store.pendingReturns.forEach((r: ReturnRecord) => list.push({ id: `rt-${r.id}`, title: `待确认退回-${r.code}`, type: 'confirm-return', time: r.returnTime, tagVariant: 'blue', action: '确认' }))
  store.openShortages.filter((s: Shortage) => s.status === 'reported' || s.status === 'approved').forEach((s: Shortage) => list.push({
    id: `s-${s.id}`, title: `缺料待处理-${s.code}-${s.priority === 'critical' ? '关键' : s.priority === 'urgent' ? '紧急' : '普通'}`,
    type: 'handle-shortage', time: s.reportTime, tagVariant: 'red', action: '查看'
  }))
  return list.sort((a, b) => (a.tagVariant === 'red' ? -1 : 0) - (b.tagVariant === 'red' ? -1 : 0))
})

const timelineItems = computed<TimelineItem[]>(() => store.timeline.slice(0, 8).map(t => ({
  id: t.id, title: t.title, description: t.description, time: t.time?.slice(5, 16), operator: t.operator, color: (t.color as TimelineItem['color']) || 'blue'
})))

const handleTodo = (t: TodoItem) => router.push(t.type === 'confirm-return' ? '/returns' : '/requisitions')
const barPct = (u: CableUsage) => u.designQty <= 0 ? 5 : Math.min(100, u.completion + (u.overPct > 0 ? 5 : 0))
const barColor = (u: CableUsage) => u.overPct > 0 ? 'bg-red-500' : u.completion >= 80 ? 'bg-green-500' : u.completion >= 50 ? 'bg-[#1E40AF]' : 'bg-orange-400'
const tagLabel = (t: TodoItem['type']) => t === 'approve-requisition' ? '待审批' : t === 'confirm-return' ? '待确认' : '缺料'
const btnVariant = (t: TodoItem['type']) => t === 'approve-requisition' ? 'primary' : t === 'confirm-return' ? 'success' : 'danger'
</script>

<template>
  <div class="space-y-6">
    <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <div v-for="(c, i) in statCards" :key="i" class="bg-white border border-gray-200 rounded-md p-5 shadow-sm border-l-4 transition-all hover:shadow-md" :class="c.border">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0 flex-1">
            <p class="text-sm text-gray-500 mb-2">{{ c.title }}</p>
            <p class="text-[28px] font-bold text-gray-900 font-mono-num leading-none mb-3">{{ c.value }}</p>
            <p class="text-xs text-gray-400">{{ c.sub }}</p>
          </div>
          <div class="w-12 h-12 rounded-lg flex items-center justify-center shrink-0" :class="[c.iconBg, c.iconColor]">
            <component :is="c.icon" class="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-5 gap-4">
      <UiCard class="xl:col-span-3">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 flex items-center gap-2"><AlertCircle class="w-[18px] h-[18px] text-orange-500" />待办事项</h3>
            <UiButton variant="ghost" size="sm" @click="router.push('/requisitions')">查看全部<template #icon><ChevronRight class="w-3.5 h-3.5" /></template></UiButton>
          </div>
        </template>
        <div v-if="todoItems.length === 0" class="py-8 text-center text-gray-400 text-sm">暂无待办事项</div>
        <div v-else class="divide-y divide-gray-100 -mx-5 -my-4">
          <div v-for="item in todoItems" :key="item.id" class="px-5 py-3.5 flex items-center gap-3 transition-colors hover:bg-gray-50" :class="{ 'breath-warn': item.breath }">
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2 mb-1 flex-wrap">
                <span class="font-medium text-gray-900 text-sm truncate">{{ item.title }}</span>
                <UiTag :variant="item.tagVariant" size="sm">{{ tagLabel(item.type) }}</UiTag>
              </div>
              <p class="text-xs text-gray-400">{{ item.time }}</p>
            </div>
            <div class="flex items-center gap-1.5 shrink-0">
              <UiButton variant="secondary" size="sm" @click="handleTodo(item)"><template #icon><Eye class="w-3.5 h-3.5" /></template>查看</UiButton>
              <UiButton :variant="btnVariant(item.type)" size="sm" @click="handleTodo(item)"><template #icon><Check v-if="item.type !== 'handle-shortage'" class="w-3.5 h-3.5" /><XCircle v-else class="w-3.5 h-3.5" /></template>{{ item.action }}</UiButton>
            </div>
          </div>
        </div>
      </UiCard>
      <UiCard class="xl:col-span-2">
        <template #header>
          <div class="flex items-center justify-between">
            <h3 class="font-semibold text-gray-900 flex items-center gap-2"><History class="w-[18px] h-[18px] text-[#1E40AF]" />最近动态</h3>
            <UiButton variant="ghost" size="sm" @click="router.push('/history')">历史<template #icon><ChevronRight class="w-3.5 h-3.5" /></template></UiButton>
          </div>
        </template>
        <div class="-mx-5 -my-4"><UiTimeline :items="timelineItems" /></div>
      </UiCard>
    </div>
    <UiCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 flex items-center gap-2"><Package class="w-[18px] h-[18px] text-orange-500" />线缆领用统计概览</h3>
          <UiBadge variant="blue" size="sm">按设计量对比</UiBadge>
        </div>
      </template>
      <div class="-mx-5 -my-4 overflow-x-auto">
        <table class="w-full min-w-max text-sm">
          <thead class="bg-gray-50 border-b border-gray-200">
            <tr>
              <th class="px-5 py-3 text-left font-medium text-gray-600 whitespace-nowrap">线缆型号</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap">设计量</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap">已领</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap">使用</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap">退回</th>
              <th class="px-4 py-3 text-right font-medium text-gray-600 whitespace-nowrap">剩余</th>
              <th class="px-5 py-3 text-left font-medium text-gray-600 whitespace-nowrap w-[260px]">完成率</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 bg-white">
            <tr v-for="u in cableStats" :key="u.cable.id" class="hover:bg-blue-50/40 transition-colors">
              <td class="px-5 py-3.5"><div class="font-medium text-gray-900">{{ u.cable.model }}</div><div class="text-xs text-gray-500 mt-0.5">{{ u.cable.name }} · {{ u.cable.unit }}</div></td>
              <td class="px-4 py-3.5 text-right font-mono-num text-gray-700">{{ u.designQty }}</td>
              <td class="px-4 py-3.5 text-right font-mono-num text-gray-900 font-medium">{{ u.issued }}</td>
              <td class="px-4 py-3.5 text-right font-mono-num text-teal-700 font-medium">{{ u.used }}</td>
              <td class="px-4 py-3.5 text-right font-mono-num text-gray-500">{{ u.returned }}</td>
              <td class="px-4 py-3.5 text-right font-mono-num"><span :class="u.remaining < 0 ? 'text-red-600 font-semibold' : 'text-gray-700'">{{ u.remaining }}</span></td>
              <td class="px-5 py-3.5">
                <div class="flex items-center gap-2.5">
                  <div class="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden shrink-0"><div class="h-full rounded-full transition-all" :class="barColor(u)" :style="{ width: barPct(u) + '%' }" /></div>
                  <span class="text-xs font-mono-num shrink-0 min-w-[60px] text-right" :class="u.overPct > 0 ? 'text-red-600 font-semibold' : 'text-gray-600'">{{ u.completion }}%<span v-if="u.overPct > 0">(+{{ u.overPct }}%)</span></span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </UiCard>
  </div>
</template>
