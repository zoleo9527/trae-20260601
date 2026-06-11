<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '@/stores/data'
import { AlertTriangle, ArrowLeftRight, History as HistoryIcon, Plus, Eye, Package, Building2, User, Clock, FileText, Upload, Trash2, Warehouse, ChevronRight } from 'lucide-vue-next'
import UiButton from '@/components/ui/UiButton.vue'
import UiBadge from '@/components/ui/UiBadge.vue'
import UiTag from '@/components/ui/UiTag.vue'
import UiTable from '@/components/ui/UiTable.vue'
import UiModal from '@/components/ui/UiModal.vue'
import UiTimeline from '@/components/ui/UiTimeline.vue'
import UiPhoto from '@/components/ui/UiPhoto.vue'
import UiInput from '@/components/ui/UiInput.vue'
import type { Shortage, ShortagePriority, ShortageStatus, ReturnRecord, ReturnStatus, ReturnItem, ReturnCondition } from '@shared/types'
import type { TimelineItem } from '@/components/ui/UiTimeline.vue'
import type { SelectOption } from '@/components/ui/UiInput.vue'

const router = useRouter()
const store = useDataStore()

const P = { critical: { v: 'red', l: '特急' }, urgent: { v: 'orange', l: '紧急' }, normal: { v: 'blue', l: '普通' } } as Record<ShortagePriority, { v: any; l: string }>
const SS = { reported: { v: 'orange', l: '待补领' }, approved: { v: 'blue', l: '补领审批中' }, supplied: { v: 'green', l: '已补料' }, closed: { v: 'default', l: '已关闭' } } as Record<ShortageStatus, { v: any; l: string }>
const RS = { pending: { v: 'orange', l: '待接收' }, received: { v: 'green', l: '已接收' }, rejected: { v: 'red', l: '已驳回' } } as Record<ReturnStatus, { v: any; l: string }>
const CL = { good: '完好', partial: '部分', damaged: '损坏' } as Record<ReturnCondition, string>
const CV = { good: 'green', partial: 'orange', damaged: 'red' } as Record<ReturnCondition, any>

const openShortages = computed(() => store.shortages.filter(s => s.status !== 'closed'))
const supReqs = computed(() => store.requisitions.filter(r => r.tags.includes('supplement')))
const issuedReqs = computed(() => store.requisitions.filter(r => r.status === 'issued' || r.status === 'completed'))
const selReq = computed(() => issuedReqs.value.find(r => r.id === returnReqId.value))

const supTimeline = computed<TimelineItem[]>(() => supReqs.value.map(r => ({
  id: r.id, title: `补领单 ${r.code}`, time: r.applyTime.slice(5, 16), operator: r.applicant,
  description: `${store.projectName(r.projectId)} · ${r.items.map(i => `${i.cableModel}×${i.quantity}`).join(', ')}`,
  color: r.status === 'pending' ? 'orange' : r.status === 'completed' || r.status === 'issued' ? 'green' : 'blue'
})))

const supOpen = ref(false)
const curS = ref<Shortage | null>(null)
const supTeam = ref(''), supApp = ref(''), supQty = ref(0), supRmk = ref(''), supLoading = ref(false)
function openSup(s: Shortage) { curS.value = s; supTeam.value = ''; supApp.value = s.reporter; supQty.value = s.shortageQty; supRmk.value = s.remark || ''; supOpen.value = true }
async function submitSup() {
  if (!curS.value || !supTeam.value) return
  supLoading.value = true
  try {
    await store.createRequisition({
      projectId: curS.value.projectId, teamId: supTeam.value,
      items: [{ cableId: curS.value.cableId, cableModel: curS.value.cableModel, cableName: store.cables.find(c => c.id === curS.value!.cableId)?.name || '', quantity: supQty.value }],
      status: 'pending', tags: ['supplement'], applicant: supApp.value || curS.value.reporter,
      applyTime: new Date().toISOString().replace('T', ' ').slice(0, 19), relatedId: curS.value.id, remark: supRmk.value
    })
    supOpen.value = false; curS.value = null
  } finally { supLoading.value = false }
}

const returnReqId = ref(''), returner = ref(''), returnRmk = ref(''), returnPhotos = ref<string[]>([])
const returnItems = ref<ReturnItem[]>([]), retLoading = ref(false)
const teamOpts = computed<SelectOption[]>(() => [{ value: '', label: '请选择班组' }, ...store.teams.map(t => ({ value: t.id, label: t.name }))])
const reqOpts = computed<SelectOption[]>(() => [{ value: '', label: '请选择关联领料单' }, ...issuedReqs.value.map(r => ({ value: r.id, label: `${r.code} · ${store.teamName(r.teamId)} · ${store.projectName(r.projectId)}` }))])
const condOpts: SelectOption[] = [{ value: 'good', label: '完好' }, { value: 'partial', label: '部分可用' }, { value: 'damaged', label: '损坏' }]
const mockP = ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=400', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400']

watch(returnReqId, v => { if (!v) returnItems.value = []; else if (selReq.value && returnItems.value.length === 0) addRetItem() })
function addRetItem() {
  if (!selReq.value) return
  const a = selReq.value.items.filter(i => !returnItems.value.some(ri => ri.cableId === i.cableId))
  if (a.length === 0) return
  returnItems.value.push({ cableId: a[0].cableId, cableModel: a[0].cableModel, returnQty: 1, condition: 'good' })
}
function rmRetItem(i: number) { returnItems.value.splice(i, 1) }
function cableOpts(idx: number): SelectOption[] {
  if (!selReq.value) return []
  const cid = returnItems.value[idx]?.cableId
  return [{ value: '', label: '选择线缆' }, ...selReq.value.items.filter(i => cid === i.cableId || !returnItems.value.some(ri => ri.cableId === i.cableId)).map(i => ({ value: i.cableId, label: `${i.cableModel} (原领${i.quantity})` }))]
}
function updRetCable(idx: number, cid: string) {
  const it = selReq.value?.items.find(i => i.cableId === cid); if (!it) return
  returnItems.value[idx].cableId = cid; returnItems.value[idx].cableModel = it.cableModel
}
function upPhoto() { returnPhotos.value.push(mockP[Math.floor(Math.random() * mockP.length)]) }
const retTotal = computed(() => returnItems.value.reduce((s, i) => s + i.returnQty, 0))

async function submitRet() {
  if (!returnReqId.value || !returner.value || returnItems.value.length === 0 || returnPhotos.value.length === 0) return
  retLoading.value = true
  try {
    await store.createReturn({
      code: `TH-${Date.now().toString().slice(-6)}`, requisitionId: returnReqId.value, projectId: selReq.value!.projectId, teamId: selReq.value!.teamId,
      items: [...returnItems.value], returner: returner.value, returnTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
      receiver: '', photos: [...returnPhotos.value], status: 'pending', remark: returnRmk.value
    })
    returnReqId.value = ''; returner.value = ''; returnRmk.value = ''; returnPhotos.value = []; returnItems.value = []
  } finally { retLoading.value = false }
}
async function recv(r: ReturnRecord) { await store.receiveReturn(r.id) }

const viewOpen = ref(false), viewR = ref<ReturnRecord | null>(null)
function openView(r: ReturnRecord) { viewR.value = r; viewOpen.value = true }

function unit(m: string) { return m.includes('米') || m.includes('RVV') ? '米' : '卷' }

onMounted(() => { if (store.requisitions.length === 0) store.loadAll() })
</script>

<template>
  <div class="p-6 space-y-5">
    <div class="grid grid-cols-1 xl:grid-cols-5 gap-5">
      <div class="xl:col-span-3 space-y-5">
        <div class="bg-white border border-gray-200 rounded-[4px] p-5 shadow-sm">
          <div class="flex items-center gap-2.5 mb-4">
            <AlertTriangle class="w-6 h-6 text-orange-500" />
            <h2 class="text-lg font-bold text-gray-900">补领管理</h2>
            <UiBadge variant="orange" size="sm">开放缺料 {{ openShortages.length }}</UiBadge>
            <UiBadge variant="blue" size="sm">待审批补领 {{ store.requisitions.filter(r => r.tags.includes('supplement') && r.status === 'pending').length }}</UiBadge>
          </div>
          <UiTable :data="openShortages">
            <template #headers>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">单号</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">项目</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">线缆/缺料数</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">优先级</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">上报人/时间</th>
              <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600">状态</th>
              <th class="px-4 py-3 text-center text-xs font-semibold text-gray-600">操作</th>
            </template>
            <template #row="{ item: s }">
              <td class="px-4 py-4" :class="{ 'bg-red-50/70 border-l-4 border-l-red-500 breath-warn': s.priority === 'critical' }"><span class="font-mono-num text-sm font-medium text-gray-800">{{ s.code }}</span></td>
              <td class="px-4 py-4" :class="{ 'bg-red-50/70': s.priority === 'critical' }"><div class="flex items-center gap-1.5 text-sm text-gray-800"><Building2 class="w-3.5 h-3.5 text-gray-400 shrink-0" /><span class="truncate max-w-[140px]">{{ store.projectName(s.projectId) }}</span></div></td>
              <td class="px-4 py-4" :class="{ 'bg-red-50/70': s.priority === 'critical' }"><div class="font-mono-num text-sm text-gray-800">{{ s.cableModel }}</div><div class="text-xs text-red-600 font-semibold mt-0.5">缺料 {{ s.shortageQty }} {{ unit(s.cableModel) }}</div></td>
              <td class="px-4 py-4" :class="{ 'bg-red-50/70': s.priority === 'critical' }"><UiBadge :variant="P[s.priority].v" size="md">{{ P[s.priority].l }}</UiBadge></td>
              <td class="px-4 py-4" :class="{ 'bg-red-50/70': s.priority === 'critical' }"><div class="flex items-center gap-1.5 text-sm text-gray-800"><User class="w-3.5 h-3.5 text-gray-400" />{{ s.reporter }}</div><div class="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5"><Clock class="w-3 h-3 text-gray-400" />{{ s.reportTime.slice(5, 16) }}</div></td>
              <td class="px-4 py-4" :class="{ 'bg-red-50/70': s.priority === 'critical' }"><UiBadge :variant="SS[s.status].v" size="md">{{ SS[s.status].l }}</UiBadge></td>
              <td class="px-4 py-4 text-center" :class="{ 'bg-red-50/70': s.priority === 'critical' }">
                <div class="flex items-center justify-center gap-1.5">
                  <UiButton v-if="s.status === 'reported'" size="sm" variant="primary" @click="openSup(s)"><template #icon><Plus class="w-3.5 h-3.5" /></template>发起补领</UiButton>
                  <UiButton v-else-if="s.status === 'approved'" size="sm" variant="secondary" @click="router.push('/requisitions')"><template #icon><ChevronRight class="w-3.5 h-3.5" /></template>查看补领单</UiButton>
                  <span v-else class="text-xs text-gray-400">已完成</span>
                </div>
              </td>
            </template>
          </UiTable>
        </div>

        <div class="bg-white border border-gray-200 rounded-[4px] p-5 shadow-sm">
          <div class="flex items-center gap-2 mb-3"><HistoryIcon class="w-5 h-5 text-[#1E40AF]" /><h3 class="font-semibold text-gray-900">补领历史</h3><UiBadge variant="blue" size="sm">{{ supReqs.length }} 条</UiBadge></div>
          <div v-if="supTimeline.length === 0" class="py-8 text-center text-gray-400 text-sm">暂无补领记录</div>
          <UiTimeline v-else :items="supTimeline.slice(0, 5)" />
        </div>
      </div>

      <div class="xl:col-span-2 space-y-5">
        <div class="bg-white border border-gray-200 rounded-[4px] p-5 shadow-sm">
          <div class="flex items-center gap-2.5 mb-4">
            <ArrowLeftRight class="w-6 h-6 text-teal-600" />
            <h2 class="text-lg font-bold text-gray-900">材料退回</h2>
            <UiBadge variant="orange" size="sm">待接收 {{ store.returns.filter(r => r.status === 'pending').length }}</UiBadge>
            <UiBadge variant="green" size="sm">已接收 {{ store.returns.filter(r => r.status === 'received').length }}</UiBadge>
          </div>

          <fieldset class="border border-gray-300 rounded-[4px] p-4 mb-4">
            <legend class="px-2 text-sm font-semibold text-gray-700">退回申请表</legend>
            <div class="space-y-3">
              <UiInput v-model="returnReqId" type="select" label="关联领料单" :options="reqOpts" required />
              <div class="grid grid-cols-2 gap-3">
                <div><label class="block text-sm font-medium text-gray-700 mb-1.5">项目</label><div class="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-[4px] text-gray-600 min-h-[38px] flex items-center">{{ selReq ? store.projectName(selReq.projectId) : '—' }}</div></div>
                <div><label class="block text-sm font-medium text-gray-700 mb-1.5">班组</label><div class="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-[4px] text-gray-600 min-h-[38px] flex items-center">{{ selReq ? store.teamName(selReq.teamId) : '—' }}</div></div>
              </div>
              <div>
                <div class="flex items-center justify-between mb-1.5">
                  <label class="text-sm font-medium text-gray-700">退回明细<span class="text-red-500 ml-0.5">*</span></label>
                  <button v-if="selReq" type="button" class="text-xs text-[#1E40AF] hover:underline flex items-center gap-1" @click="addRetItem"><Plus class="w-3 h-3" />添加</button>
                </div>
                <div class="border border-gray-200 rounded-[4px] overflow-hidden">
                  <table class="w-full text-sm">
                    <thead class="bg-gray-50 border-b border-gray-200"><tr><th class="px-2.5 py-2 text-left text-xs font-semibold text-gray-600">线缆型号</th><th class="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-16">数量</th><th class="px-2 py-2 text-left text-xs font-semibold text-gray-600 w-24">完好</th><th class="w-8"></th></tr></thead>
                    <tbody class="divide-y divide-gray-100">
                      <tr v-for="(it, idx) in returnItems" :key="idx">
                        <td class="px-2 py-1.5"><select :value="it.cableId" class="w-full px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#1E40AF]" @change="(e) => updRetCable(idx, (e.target as HTMLSelectElement).value)"><option v-for="o in cableOpts(idx)" :key="o.value" :value="o.value">{{ o.label }}</option></select></td>
                        <td class="px-2 py-1.5"><input type="number" min="1" v-model.number="it.returnQty" class="w-full px-2 py-1.5 text-sm text-right bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#1E40AF] font-mono-num" /></td>
                        <td class="px-2 py-1.5"><select v-model="it.condition" class="w-full px-2 py-1.5 text-sm bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#1E40AF]"><option v-for="o in condOpts" :key="o.value" :value="o.value">{{ o.label }}</option></select></td>
                        <td class="px-1 py-1.5 text-center"><button type="button" class="p-1 text-gray-400 hover:text-red-500 transition-colors" @click="rmRetItem(idx)"><Trash2 class="w-3.5 h-3.5" /></button></td>
                      </tr>
                      <tr v-if="returnItems.length === 0"><td colspan="4" class="px-3 py-4 text-center text-xs text-gray-400">请先选择领料单，然后添加退回明细</td></tr>
                    </tbody>
                    <tfoot class="bg-gray-50 border-t border-gray-200"><tr><td class="px-2.5 py-2 text-xs font-semibold text-gray-700">合计</td><td class="px-2 py-2 text-right font-mono-num text-xs font-bold text-gray-900">{{ retTotal }}</td><td colspan="2"></td></tr></tfoot>
                  </table>
                </div>
              </div>
              <UiInput v-model="returner" label="退回人" placeholder="请输入退回人姓名" required />
              <UiInput v-model="returnRmk" type="textarea" label="退回说明" :rows="2" placeholder="请说明退回原因、使用情况等" required />
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1.5">材料照片<span class="text-red-500 ml-0.5">*</span></label>
                <div class="flex items-start gap-2 flex-wrap">
                  <div v-for="(p, i) in returnPhotos" :key="i" class="relative w-16 h-16 rounded-[4px] overflow-hidden border border-gray-200 bg-gray-100">
                    <img :src="p" class="w-full h-full object-cover" />
                    <button type="button" class="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600" @click="returnPhotos.splice(i, 1)">×</button>
                  </div>
                  <button type="button" class="w-16 h-16 rounded-[4px] border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-[#1E40AF] hover:text-[#1E40AF] transition-colors gap-0.5" @click="upPhoto"><Upload class="w-4 h-4" /><span class="text-[10px]">上传</span></button>
                </div>
              </div>
              <UiButton variant="success" class="w-full" :loading="retLoading" :disabled="!returnReqId || !returner || returnItems.length === 0 || returnPhotos.length === 0" @click="submitRet"><template #icon><ArrowLeftRight class="w-4 h-4" /></template>提交退回单</UiButton>
            </div>
          </fieldset>

          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-700 flex items-center gap-1.5"><FileText class="w-4 h-4 text-gray-500" />退回记录</h3>
            <div v-if="store.returns.length === 0" class="py-8 text-center text-gray-400 text-sm border border-gray-200 rounded-[4px] bg-gray-50">暂无退回记录</div>
            <div v-else class="space-y-3">
              <div v-for="r in store.returns" :key="r.id" class="border border-gray-200 rounded-[4px] bg-white overflow-hidden">
                <div class="px-3 py-2.5 bg-gray-50 border-b border-gray-200 flex items-center justify-between"><span class="font-mono-num text-sm font-semibold text-gray-800">{{ r.code }}</span><UiBadge :variant="RS[r.status].v" size="sm">{{ RS[r.status].l }}</UiBadge></div>
                <div class="p-3 space-y-2 text-xs">
                  <div class="grid grid-cols-2 gap-y-1 text-gray-600"><span class="text-gray-400">关联领料：</span><span class="font-mono-num truncate">{{ store.requisitions.find(x => x.id === r.requisitionId)?.code || '—' }}</span><span class="text-gray-400">项目：</span><span class="truncate">{{ store.projectName(r.projectId) }}</span><span class="text-gray-400">班组：</span><span>{{ store.teamName(r.teamId) }}</span><span class="text-gray-400">退回人：</span><span>{{ r.returner }}</span><span class="text-gray-400 col-span-2">时间：{{ r.returnTime.slice(5, 16) }}</span></div>
                  <div class="border-t border-gray-100 pt-2 space-y-1"><div v-for="(it, i) in r.items" :key="i" class="flex items-center gap-1.5 flex-wrap"><span class="font-mono-num text-gray-800">{{ it.cableModel }}</span><span class="text-gray-400">×</span><span class="text-gray-700">{{ it.returnQty }}{{ unit(it.cableModel) }}</span><UiTag :variant="CV[it.condition]" size="sm">{{ CL[it.condition] }}</UiTag></div></div>
                  <div v-if="r.photos.length > 0" class="flex gap-1"><div v-for="(p, i) in r.photos.slice(0, 3)" :key="i" class="w-10 h-10 rounded-[4px] overflow-hidden border border-gray-200 bg-gray-100 shrink-0"><img :src="p" class="w-full h-full object-cover" /></div><div v-if="r.photos.length > 3" class="w-10 h-10 rounded-[4px] border border-gray-200 bg-gray-50 flex items-center justify-center text-[10px] text-gray-500">+{{ r.photos.length - 3 }}</div></div>
                  <div class="flex justify-end gap-1.5 pt-1 border-t border-gray-100">
                    <UiButton v-if="r.status === 'pending'" size="sm" variant="success" @click="recv(r)"><template #icon><Warehouse class="w-3.5 h-3.5" /></template>仓库接收</UiButton>
                    <UiButton size="sm" variant="secondary" @click="openView(r)"><template #icon><Eye class="w-3.5 h-3.5" /></template>查看凭证</UiButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <UiModal v-model:open="supOpen" class="!max-w-2xl">
      <template #title><div class="flex items-center gap-2"><Plus class="w-5 h-5 text-[#1E40AF]" /><span class="font-semibold">发起补领申请</span><span v-if="curS" class="text-sm font-normal text-gray-500 ml-1">· {{ curS.code }}</span></div></template>
      <div v-if="curS" class="space-y-4">
        <div class="grid grid-cols-2 gap-4">
          <div><label class="block text-sm font-medium text-gray-700 mb-1.5">关联缺料单号</label><div class="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-[4px] font-mono-num text-gray-600">{{ curS.code }}</div></div>
          <div><label class="block text-sm font-medium text-gray-700 mb-1.5">项目</label><div class="px-3 py-2 text-sm bg-gray-50 border border-gray-200 rounded-[4px] text-gray-600 truncate">{{ store.projectName(curS.projectId) }}</div></div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <UiInput v-model="supTeam" type="select" label="施工班组" :options="teamOpts" required />
          <UiInput v-model="supApp" label="申请人" :placeholder="curS.reporter" />
        </div>
        <fieldset class="border border-gray-300 rounded-[4px] p-4">
          <legend class="px-2 text-sm font-semibold text-gray-700">线缆明细</legend>
          <table class="w-full text-sm">
            <thead class="bg-gray-50/50"><tr><th class="px-2 py-2 text-left text-xs font-semibold text-gray-600">线缆型号</th><th class="px-2 py-2 text-left text-xs font-semibold text-gray-600">名称</th><th class="px-2 py-2 text-right text-xs font-semibold text-gray-600 w-32">补领数量</th></tr></thead>
            <tbody><tr class="border-t border-gray-100"><td class="px-2 py-2 font-mono-num text-gray-800">{{ curS.cableModel }}</td><td class="px-2 py-2 text-gray-600">{{ store.cables.find(c => c.id === curS!.cableId)?.name || '—' }}</td><td class="px-2 py-2"><input type="number" min="1" v-model.number="supQty" class="w-full px-2 py-1.5 text-sm text-right bg-white border border-gray-300 rounded-[4px] focus:outline-none focus:border-[#1E40AF] font-mono-num" /></td></tr></tbody>
          </table>
        </fieldset>
        <UiInput v-model="supRmk" type="textarea" label="补领原因说明" :rows="3" :placeholder="curS.remark || '请简要说明补领原因、施工节点等'" />
      </div>
      <template #footer><div class="flex justify-end gap-2"><UiButton variant="secondary" @click="supOpen = false">取消</UiButton><UiButton variant="primary" :loading="supLoading" :disabled="!supTeam" @click="submitSup"><template #icon><Package class="w-4 h-4" /></template>提交补领单</UiButton></div></template>
    </UiModal>

    <UiModal v-model:open="viewOpen" class="!max-w-3xl">
      <template #title><div class="flex items-center justify-between w-full"><div class="flex items-center gap-2"><FileText class="w-5 h-5 text-[#1E40AF]" /><span class="font-semibold">退回单凭证</span><span v-if="viewR" class="font-mono-num text-sm text-gray-500 ml-1">{{ viewR.code }}</span></div><UiBadge v-if="viewR" :variant="RS[viewR.status].v" size="md">{{ RS[viewR.status].l }}</UiBadge></div></template>
      <div v-if="viewR" class="space-y-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border border-gray-200 rounded-[4px] p-4 bg-gray-50/50"><div><div class="text-xs text-gray-500 mb-1">项目</div><div class="font-medium text-gray-800 truncate">{{ store.projectName(viewR.projectId) }}</div></div><div><div class="text-xs text-gray-500 mb-1">班组</div><div class="font-medium text-gray-800">{{ store.teamName(viewR.teamId) }}</div></div><div><div class="text-xs text-gray-500 mb-1">退回人</div><div class="font-medium text-gray-800">{{ viewR.returner }}</div></div><div><div class="text-xs text-gray-500 mb-1">退回时间</div><div class="font-medium text-gray-800">{{ viewR.returnTime }}</div></div></div>
        <fieldset class="border border-gray-300 rounded-[4px] p-4">
          <legend class="px-2 text-sm font-semibold text-gray-700">退回明细</legend>
          <table class="w-full text-sm">
            <thead class="bg-gray-50/50"><tr><th class="px-3 py-2 text-left text-xs font-semibold text-gray-600">线缆型号</th><th class="px-3 py-2 text-right text-xs font-semibold text-gray-600">退回数量</th><th class="px-3 py-2 text-left text-xs font-semibold text-gray-600">完好状态</th></tr></thead>
            <tbody class="divide-y divide-gray-100"><tr v-for="(it, i) in viewR.items" :key="i"><td class="px-3 py-2.5 font-mono-num text-gray-800">{{ it.cableModel }}</td><td class="px-3 py-2.5 text-right font-mono-num text-gray-900 font-medium">{{ it.returnQty }}{{ unit(it.cableModel) }}</td><td class="px-3 py-2.5"><UiTag :variant="CV[it.condition]" size="sm">{{ CL[it.condition] }}</UiTag></td></tr></tbody>
          </table>
        </fieldset>
        <div v-if="viewR.remark" class="border border-gray-200 rounded-[4px] p-4"><div class="text-xs text-gray-500 mb-1.5">退回说明</div><p class="text-sm text-gray-700">{{ viewR.remark }}</p></div>
        <div><div class="text-xs text-gray-500 mb-2">材料照片（{{ viewR.photos.length }}张）</div><UiPhoto :src="viewR.photos" /></div>
        <div v-if="viewR.receiver" class="grid grid-cols-2 gap-4 text-sm border border-green-200 rounded-[4px] p-4 bg-green-50/50"><div><div class="text-xs text-green-700 mb-1">接收人</div><div class="font-medium text-gray-800">{{ viewR.receiver }}</div></div><div><div class="text-xs text-green-700 mb-1">接收时间</div><div class="font-medium text-gray-800">{{ viewR.receiveTime }}</div></div></div>
      </div>
      <template #footer><div class="flex justify-end"><UiButton variant="secondary" @click="viewOpen = false">关闭</UiButton></div></template>
    </UiModal>
  </div>
</template>
