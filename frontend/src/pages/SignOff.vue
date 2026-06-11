<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import {
  ChevronDown, ChevronRight, Check, X, Eye, Clock, User, MessageSquare,
  Search, CheckSquare, Square, AlertTriangle, Ban, AlertOctagon, Users
} from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import StatusBadge from '@/components/StatusBadge.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import type { CompletionDocument, DocumentDetail } from '@/types'

const router = useRouter()
const route = useRoute()
const { get, post, put } = useApi()

type FilterKey = 'all' | 'overdue' | 'hasException' | 'rejected'
type RoleFilterKey = 'all' | '项目负责人' | '施工班组长' | '资料员'

const documents = ref<CompletionDocument[]>([])
const loading = ref(true)
const expandedId = ref<string | null>(null)
const detailCache = ref<Map<string, DocumentDetail>>(new Map())
const searchQuery = ref('')
const activeFilter = ref<FilterKey>('all')
const activeRoleFilter = ref<RoleFilterKey>('all')

const selectedIds = ref<Set<string>>(new Set())

const drawerOpen = ref(false)
const drawerDocId = ref<string | null>(null)
const drawerExceptions = ref<any[]>([])

const collapsedGroups = ref<Set<string>>(new Set(['rejected', 'signed']))

const roleFilters: Array<{ key: RoleFilterKey; label: string; icon: string }> = [
  { key: 'all', label: '全部角色', icon: 'users' },
  { key: '项目负责人', label: '项目负责人', icon: 'user' },
  { key: '施工班组长', label: '施工班组长', icon: 'user' },
  { key: '资料员', label: '资料员', icon: 'user' },
]

const filters: Array<{ key: FilterKey; label: string }> = [
  { key: 'all', label: '全部' },
  { key: 'overdue', label: '超时' },
  { key: 'hasException', label: '未解决异常' },
  { key: 'rejected', label: '客户驳回' },
]

function matchRoleFilter(doc: CompletionDocument): boolean {
  if (activeRoleFilter.value === 'all') return true
  return doc.assignee_role === activeRoleFilter.value
}

const roleStats = computed(() => {
  const relevant = documents.value.filter(d => d.status === '待签认' || d.status === '已驳回')
  return {
    '项目负责人': relevant.filter(d => d.assignee_role === '项目负责人').length,
    '施工班组长': relevant.filter(d => d.assignee_role === '施工班组长').length,
    '资料员': relevant.filter(d => d.assignee_role === '资料员').length,
  }
})

function isOverdue(doc: CompletionDocument) {
  const days = (Date.now() - new Date(doc.updated_at + 'Z').getTime()) / 86400000
  return days > 5
}

function hasUnresolvedException(doc: CompletionDocument) {
  return (doc.unresolved_exceptions_count || 0) > 0
}

function wasRejected(doc: CompletionDocument) {
  return !!doc.latest_reject_reason || doc.status === '已驳回'
}

function matchFilter(doc: CompletionDocument): boolean {
  if (activeFilter.value === 'all') return true
  if (activeFilter.value === 'overdue') return isOverdue(doc)
  if (activeFilter.value === 'hasException') return hasUnresolvedException(doc)
  if (activeFilter.value === 'rejected') return wasRejected(doc)
  return true
}

function toggleGroup(group: string) {
  if (collapsedGroups.value.has(group)) collapsedGroups.value.delete(group)
  else collapsedGroups.value.add(group)
}

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

const pendingDocs = computed(() => {
  let docs = documents.value.filter(d => d.status === '待签认' && matchFilter(d) && matchRoleFilter(d))
  if (searchQuery.value) docs = docs.filter(d => d.project_name.includes(searchQuery.value))
  docs.sort((a, b) => {
    const aRisk = hasUnresolvedException(a) ? 1 : 0
    const bRisk = hasUnresolvedException(b) ? 1 : 0
    if (aRisk !== bRisk) return bRisk - aRisk
    return new Date(a.updated_at + 'Z').getTime() - new Date(b.updated_at + 'Z').getTime()
  })
  return docs
})
const rejectedDocs = computed(() => {
  let docs = documents.value.filter(d => d.status === '已驳回' && matchFilter(d) && matchRoleFilter(d))
  if (searchQuery.value) docs = docs.filter(d => d.project_name.includes(searchQuery.value))
  return docs
})
const signedDocs = computed(() => {
  if (activeFilter.value !== 'all') return []
  let docs = documents.value.filter(d => d.status === '已签认' && matchRoleFilter(d))
  if (searchQuery.value) docs = docs.filter(d => d.project_name.includes(searchQuery.value))
  return docs
})

const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => pendingDocs.value.length > 0 && pendingDocs.value.every(d => selectedIds.value.has(d.id)))

const filterDescription = computed(() => {
  const parts: string[] = []
  if (activeRoleFilter.value !== 'all') parts.push(activeRoleFilter.value)
  if (activeFilter.value === 'overdue') parts.push('超时')
  else if (activeFilter.value === 'hasException') parts.push('有未解决异常')
  else if (activeFilter.value === 'rejected') parts.push('被客户驳回')
  return parts.length > 0 ? parts.join('、') : ''
})

function setRoleFilter(key: RoleFilterKey) {
  activeRoleFilter.value = key
  selectedIds.value.clear()
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    pendingDocs.value.forEach(d => selectedIds.value.add(d.id))
  }
}

async function loadDocuments() {
  loading.value = true
  try {
    documents.value = await get<CompletionDocument[]>('/documents')
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function expandDoc(doc: CompletionDocument) {
  if (expandedId.value === doc.id) {
    expandedId.value = null
    return
  }
  expandedId.value = doc.id
  if (!detailCache.value.has(doc.id)) {
    try {
      const detail = await get<DocumentDetail>(`/documents/${doc.id}`)
      detailCache.value.set(doc.id, detail)
    } catch (e) {
      console.error(e)
    }
  }
}

function openSignOffModal(doc: CompletionDocument, result: '已签认' | '已驳回') {
  signOffDoc.value = doc
  signOffResult.value = result
  signOffClient.value = ''
  signOffComment.value = ''
  showSignOffModal.value = true
}

function openBatchModal(result: '已签认' | '已驳回') {
  if (selectedIds.value.size === 0) return
  batchResult.value = result
  batchClient.value = ''
  batchComment.value = ''
  showBatchModal.value = true
}

async function submitSignOff() {
  if (!signOffDoc.value || !signOffClient.value) return
  try {
    await post(`/documents/${signOffDoc.value.id}/sign-off`, {
      clientName: signOffClient.value,
      result: signOffResult.value,
      comment: signOffComment.value || undefined
    })
    showSignOffModal.value = false
    detailCache.value.delete(signOffDoc.value.id)
    await loadDocuments()
  } catch (e) {
    console.error(e)
  }
}

async function submitBatchSignOff() {
  if (!batchClient.value || selectedIds.value.size === 0) return
  try {
    await put('/documents/batch-sign-off', {
      ids: Array.from(selectedIds.value),
      clientName: batchClient.value,
      result: batchResult.value,
      comment: batchComment.value || undefined
    })
    showBatchModal.value = false
    selectedIds.value.clear()
    detailCache.value.clear()
    await loadDocuments()
  } catch (e) {
    console.error(e)
  }
}

async function openDrawer(doc: CompletionDocument) {
  drawerDocId.value = doc.id
  drawerOpen.value = true
  await loadDrawerExceptions(doc.id)
}

async function loadDrawerExceptions(docId: string) {
  try {
    drawerExceptions.value = await get<any[]>(`/documents/${docId}/exceptions`)
  } catch (e) {
    console.error(e)
  }
}

async function onDrawerRefresh() {
  await loadDocuments()
  if (drawerDocId.value) {
    await loadDrawerExceptions(drawerDocId.value)
    if (detailCache.value.has(drawerDocId.value)) {
      try {
        const detail = await get<DocumentDetail>(`/documents/${drawerDocId.value}`)
        detailCache.value.set(drawerDocId.value, detail)
      } catch (e) {
        console.error(e)
      }
    }
  }
}

const stageColors: Record<string, string> = {
  '整理': 'bg-blue-500',
  '审核': 'bg-amber-500',
  '签认': 'bg-emerald-500',
  '异常处理': 'bg-red-500',
}

const stageLabels: Record<string, string> = {
  '整理': '整理',
  '审核': '审核',
  '签认': '签认',
  '异常处理': '异常',
}

function formatTime(ts: string) {
  return new Date(ts + 'Z').toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function formatDate(ts: string) {
  return new Date(ts + 'Z').toLocaleString('zh-CN')
}

const groups = computed(() => [
  { key: 'pending', label: '待签认', docs: pendingDocs.value, color: 'text-amber-400', selectable: true },
  { key: 'rejected', label: '已驳回', docs: rejectedDocs.value, color: 'text-red-400', selectable: false },
  { key: 'signed', label: '已签认', docs: signedDocs.value, color: 'text-emerald-400', selectable: false },
])

const showSignOffModal = ref(false)
const signOffDoc = ref<CompletionDocument | null>(null)
const signOffResult = ref<'已签认' | '已驳回'>('已签认')
const signOffClient = ref('')
const signOffComment = ref('')

const showBatchModal = ref(false)
const batchResult = ref<'已签认' | '已驳回'>('已签认')
const batchClient = ref('')
const batchComment = ref('')

async function handleHighlight() {
  const id = route.query.highlight as string
  if (!id) return

  await nextTick()
  const doc = documents.value.find(d => d.id === id)
  if (!doc) return

  if (doc.status === '待签认') collapsedGroups.value.delete('pending')
  else if (doc.status === '已驳回') collapsedGroups.value.delete('rejected')
  else if (doc.status === '已签认') collapsedGroups.value.delete('signed')

  await nextTick()
  const el = document.getElementById(`doc-${id}`)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('ring-2', 'ring-amber-400')
    setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2000)
  }
}

watch(
  () => route.query.highlight,
  () => { if (!loading.value) handleHighlight() }
)

onMounted(async () => {
  await loadDocuments()
  handleHighlight()
})
</script>

<template>
  <div class="p-6 max-w-[1000px] mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">客户签认</h1>
        <p class="text-slate-400 text-sm mt-1">回看全流程处理备注，签署确认或批量驳回</p>
      </div>
      <div class="flex items-center gap-4 text-xs">
        <span class="text-amber-400 flex items-center gap-1"><Clock :size="12" />待签认 {{ pendingDocs.length }}</span>
        <span class="text-red-400 flex items-center gap-1"><X :size="12" />已驳回 {{ rejectedDocs.length }}</span>
        <span class="text-emerald-400 flex items-center gap-1"><Check :size="12" />已签认 {{ signedDocs.length }}</span>
      </div>
    </div>

    <div class="flex items-center gap-2 mb-3 flex-wrap">
      <Users :size="14" class="text-slate-500 flex-shrink-0" />
      <div class="flex gap-1.5 flex-wrap">
        <button
          v-for="rf in roleFilters"
          :key="rf.key"
          @click="setRoleFilter(rf.key)"
          class="px-3 py-1.5 text-xs rounded-lg transition-colors border"
          :class="activeRoleFilter === rf.key
            ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
            : 'bg-[#1e293b] text-slate-400 border-[#334155] hover:text-white hover:border-slate-500'"
        >
          {{ rf.label }}
          <span v-if="rf.key !== 'all' && roleStats[rf.key as keyof typeof roleStats] > 0" class="ml-1 text-[10px] opacity-70">({{ roleStats[rf.key as keyof typeof roleStats] }})</span>
        </button>
      </div>
    </div>

    <div class="flex items-center gap-3 mb-4 flex-wrap">
      <div class="relative flex-1 min-w-[200px] max-w-[300px]">
        <Search :size="14" class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          v-model="searchQuery"
          placeholder="搜索项目名称..."
          class="w-full bg-[#1e293b] border border-[#334155] rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
        />
      </div>
      <div class="flex gap-1 bg-[#1e293b] border border-[#334155] rounded-lg p-1">
        <button
          v-for="f in filters"
          :key="f.key"
          @click="activeFilter = f.key; selectedIds.clear()"
          class="px-3 py-1.5 text-xs rounded-md transition-colors"
          :class="activeFilter === f.key ? 'bg-amber-500/20 text-amber-400' : 'text-slate-400 hover:text-white'"
        >
          {{ f.label }}
        </button>
      </div>
    </div>

    <div v-if="selectedCount > 0" class="flex items-center gap-3 mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
      <span class="text-sm text-amber-400">已选 {{ selectedCount }} 项待签认资料</span>
      <button @click="openBatchModal('已签认')" class="btn-success text-xs px-3 py-1.5 flex items-center gap-1">
        <Check :size="12" />批量签署确认
      </button>
      <button @click="openBatchModal('已驳回')" class="btn-danger text-xs px-3 py-1.5 flex items-center gap-1">
        <X :size="12" />批量驳回
      </button>
      <button @click="selectedIds.clear()" class="text-xs text-slate-400 hover:text-white ml-auto">取消选择</button>
    </div>

    <div v-if="!loading" class="space-y-4">
      <div v-for="group in groups" :key="group.key">
        <div class="flex items-center gap-2 mb-1">
          <button
            @click="toggleGroup(group.key)"
            class="flex items-center gap-2 py-3 px-1"
          >
            <component :is="collapsedGroups.has(group.key) ? ChevronRight : ChevronDown" :size="16" class="text-slate-500" />
            <span class="text-sm font-medium" :class="group.color">{{ group.label }}</span>
            <span class="text-xs text-slate-500">({{ group.docs.length }})</span>
          </button>
          <button
            v-if="group.selectable && group.docs.length > 0"
            @click="toggleSelectAll"
            class="text-slate-400 hover:text-white transition-colors ml-2"
          >
            <component :is="allSelected ? CheckSquare : Square" :size="14" />
            <span class="text-xs text-slate-500 ml-1">全选</span>
          </button>
        </div>

        <div v-if="!collapsedGroups.has(group.key)" class="space-y-3 pl-2">
          <div
            v-for="doc in group.docs"
            :key="doc.id"
            :id="`doc-${doc.id}`"
            class="card relative transition-all duration-300"
          >
            <div v-if="group.selectable" class="absolute top-3 left-3 z-10" @click.stop="toggleSelect(doc.id)">
              <component
                :is="selectedIds.has(doc.id) ? CheckSquare : Square"
                :size="16"
                :class="selectedIds.has(doc.id) ? 'text-amber-400' : 'text-slate-500'"
                class="cursor-pointer hover:text-amber-400 transition-colors"
              />
            </div>

            <div :class="group.selectable ? 'pl-7' : ''">
              <div
                class="flex items-center justify-between cursor-pointer"
                @click="expandDoc(doc)"
              >
                <div class="flex items-center gap-3 min-w-0">
                  <StatusBadge :status="doc.status" />
                  <div class="min-w-0">
                    <div class="text-sm font-medium text-white truncate">{{ doc.project_name }}</div>
                    <div class="text-xs text-slate-400 flex items-center gap-2">
                      <span>{{ doc.doc_type }}</span>
                      <span class="text-slate-600">·</span>
                      <User :size="10" />
                      <span>{{ doc.assignee_name }} ({{ doc.assignee_role }})</span>
                    </div>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-shrink-0">
                  <span v-if="hasUnresolvedException(doc) && doc.status === '待签认'" class="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 flex items-center gap-1 cursor-pointer" @click.stop="openDrawer(doc)">
                    <AlertTriangle :size="10" />{{ doc.unresolved_exceptions_count }}异常
                  </span>
                  <span v-if="wasRejected(doc) && doc.status === '待签认'" class="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 flex items-center gap-1">
                    <Ban :size="10" />曾驳回
                  </span>
                  <span v-if="isOverdue(doc) && doc.status === '待签认'" class="text-xs px-2 py-0.5 rounded bg-orange-500/10 text-orange-400 flex items-center gap-1">
                    <Clock :size="10" />超时
                  </span>
                  <button class="text-xs text-slate-400 hover:text-amber-400 transition-colors flex items-center gap-1" @click.stop="expandDoc(doc)">
                    <Eye :size="12" /> 回看
                  </button>
                  <component :is="expandedId === doc.id ? ChevronDown : ChevronRight" :size="14" class="text-slate-500" />
                </div>
              </div>

              <div v-if="doc.block_reason && doc.status !== '已签认'" class="mt-2 text-xs flex items-start gap-1.5 px-2 py-1.5 rounded" :class="
                doc.status === '已驳回' ? 'bg-red-500/5 text-red-300 border border-red-500/10' :
                wasRejected(doc) ? 'bg-red-500/5 text-red-300 border border-red-500/10' :
                hasUnresolvedException(doc) ? 'bg-orange-500/5 text-orange-300 border border-orange-500/10' :
                isOverdue(doc) ? 'bg-orange-500/5 text-orange-300 border border-orange-500/10' :
                'bg-slate-700/30 text-slate-300 border border-slate-700/50'
              ">
                <AlertOctagon :size="11" class="flex-shrink-0 mt-0.5" />
                <span class="leading-relaxed">卡在这里：{{ doc.block_reason }}</span>
              </div>

              <div v-else-if="doc.latest_remark && expandedId !== doc.id" class="mt-2 text-xs text-slate-400 truncate px-2 py-1.5 bg-slate-800/50 rounded">
                最近备注：{{ doc.latest_remark }}
              </div>

              <div v-if="expandedId === doc.id && detailCache.has(doc.id)" class="mt-4 pt-4 border-t border-[#334155]">
                <div v-if="detailCache.get(doc.id)?.block_reason && doc.status !== '已签认'" class="mb-4 text-xs flex items-start gap-1.5 px-3 py-2.5 rounded" :class="
                  doc.status === '已驳回' ? 'bg-red-500/10 text-red-300 border border-red-500/20' :
                  'bg-amber-500/10 text-amber-300 border border-amber-500/20'
                ">
                  <AlertOctagon :size="12" class="flex-shrink-0 mt-0.5" />
                  <span class="leading-relaxed font-medium">为什么没签完：{{ detailCache.get(doc.id)?.block_reason }}</span>
                </div>

                <div class="flex items-center gap-2 mb-3">
                  <MessageSquare :size="14" class="text-slate-400" />
                  <span class="text-xs font-medium text-slate-300">处理备注（全流程穿透 · 含客户签认意见）</span>
                </div>

                <div class="space-y-3 pl-4 border-l-2 border-slate-700 mb-4">
                  <div v-for="remark in detailCache.get(doc.id)?.remarks || []" :key="remark.id" class="relative pl-4">
                    <div
                      class="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full"
                      :class="stageColors[remark.stage] || 'bg-slate-500'"
                    ></div>
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="text-xs px-1.5 py-0.5 rounded text-slate-300" :class="(stageColors[remark.stage] || 'bg-slate-500') + '/10'">
                        {{ stageLabels[remark.stage] || remark.stage }}
                      </span>
                      <span class="text-xs text-slate-300">{{ remark.author }}</span>
                      <span class="text-xs text-slate-600">{{ remark.author_role }}</span>
                      <span class="text-xs text-slate-600">{{ formatTime(remark.created_at) }}</span>
                    </div>
                    <p class="text-sm text-slate-300">{{ remark.content }}</p>
                  </div>
                </div>

                <div v-if="detailCache.get(doc.id)?.signOffs?.length" class="mb-4">
                  <div class="text-xs font-medium text-slate-400 mb-2">签认记录</div>
                  <div v-for="so in detailCache.get(doc.id)?.signOffs" :key="so.id" class="flex items-center gap-2 text-xs py-1.5 px-2 rounded" :class="so.result === '已签认' ? 'bg-emerald-500/5 text-emerald-400' : 'bg-red-500/5 text-red-400'">
                    <component :is="so.result === '已签认' ? Check : X" :size="12" />
                    <span>{{ so.client_name }}</span>
                    <span class="text-slate-600">·</span>
                    <span>{{ so.result }}</span>
                    <span v-if="so.comment" class="text-slate-500">· {{ so.comment }}</span>
                    <span class="text-slate-600 ml-auto">{{ formatDate(so.signed_at) }}</span>
                  </div>
                </div>

                <div v-if="doc.status === '待签认'" class="flex gap-2 pt-2">
                  <button @click="openSignOffModal(doc, '已签认')" class="btn-success text-sm flex items-center gap-1">
                    <Check :size="14" /> 签署确认
                  </button>
                  <button @click="openSignOffModal(doc, '已驳回')" class="btn-danger text-sm flex items-center gap-1">
                    <X :size="14" /> 驳回
                  </button>
                </div>
              </div>

              <div v-if="expandedId === doc.id && !detailCache.has(doc.id)" class="mt-4 pt-4 border-t border-[#334155]">
                <div class="flex items-center justify-center py-4">
                  <div class="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                  <span class="text-xs text-slate-500 ml-2">加载中...</span>
                </div>
              </div>
            </div>
          </div>

          <div v-if="group.docs.length === 0" class="text-xs text-slate-500 text-center py-4 pl-4">
            {{ filterDescription ? `暂无${filterDescription}的${group.label}资料` : `暂无${group.label}的资料` }}
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div v-for="i in 4" :key="i" class="card animate-pulse">
        <div class="h-5 bg-slate-700 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-slate-700 rounded w-1/3"></div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showSignOffModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showSignOffModal = false"></div>
        <div class="relative w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-2xl">
          <h2 class="text-lg font-bold text-white mb-1">
            {{ signOffResult === '已签认' ? '签署确认' : '驳回签认' }}
          </h2>
          <p class="text-sm text-slate-400 mb-4">{{ signOffDoc?.project_name }}</p>

          <div class="space-y-3">
            <div>
              <label class="text-xs text-slate-400 mb-1 block">客户姓名</label>
              <input v-model="signOffClient" placeholder="输入客户姓名" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label class="text-xs text-slate-400 mb-1 block">{{ signOffResult === '已驳回' ? '驳回原因（将穿透备注）' : '备注（可选，将穿透备注）' }}</label>
              <textarea v-model="signOffComment" :placeholder="signOffResult === '已驳回' ? '请填写驳回原因...' : '可选备注...'" rows="3" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"></textarea>
            </div>
          </div>

          <div class="flex gap-2 mt-5">
            <button @click="submitSignOff" :disabled="!signOffClient" class="flex-1 text-sm py-2 rounded-lg font-medium transition-colors" :class="signOffResult === '已签认' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'">
              {{ signOffResult === '已签认' ? '确认签署' : '确认驳回' }}
            </button>
            <button @click="showSignOffModal = false" class="btn-secondary text-sm">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showBatchModal" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showBatchModal = false"></div>
        <div class="relative w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-2xl">
          <h2 class="text-lg font-bold text-white mb-1">
            批量{{ batchResult === '已签认' ? '签署确认' : '驳回签认' }}
          </h2>
          <p class="text-sm text-slate-400 mb-4">共 {{ selectedCount }} 项资料</p>

          <div class="space-y-3">
            <div>
              <label class="text-xs text-slate-400 mb-1 block">客户姓名</label>
              <input v-model="batchClient" placeholder="输入客户姓名" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label class="text-xs text-slate-400 mb-1 block">{{ batchResult === '已驳回' ? '驳回原因（将穿透备注）' : '备注（可选，将穿透备注）' }}</label>
              <textarea v-model="batchComment" :placeholder="batchResult === '已驳回' ? '请填写驳回原因...' : '可选备注...'" rows="3" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"></textarea>
            </div>
          </div>

          <div class="flex gap-2 mt-5">
            <button @click="submitBatchSignOff" :disabled="!batchClient" class="flex-1 text-sm py-2 rounded-lg font-medium transition-colors" :class="batchResult === '已签认' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' : 'bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20'">
              确认批量{{ batchResult === '已签认' ? '签署' : '驳回' }}
            </button>
            <button @click="showBatchModal = false" class="btn-secondary text-sm">取消</button>
          </div>
        </div>
      </div>
    </Teleport>

    <ExceptionDrawer
      :open="drawerOpen"
      :document-id="drawerDocId"
      :exceptions="drawerExceptions"
      @close="drawerOpen = false"
      @refresh="onDrawerRefresh"
    />
  </div>
</template>
