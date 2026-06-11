<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { Search, Filter, CheckSquare, Square, Upload, AlertTriangle, UserPlus, Plus, RefreshCw, ChevronRight, PenLine, ExternalLink } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import StatusBadge from '@/components/StatusBadge.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import type { CompletionDocument, DocStatus, AssigneeRole, ExceptionCategory } from '@/types'

const router = useRouter()
const { get, post, put } = useApi()

const documents = ref<CompletionDocument[]>([])
const loading = ref(true)
const selectedIds = ref<Set<string>>(new Set())

const statusFilter = ref<DocStatus | ''>('')
const roleFilter = ref<AssigneeRole | ''>('')
const searchQuery = ref('')

const drawerOpen = ref(false)
const drawerDocId = ref<string | null>(null)
const drawerExceptions = ref<any[]>([])

const showBatchReassign = ref(false)
const reassignName = ref('')
const reassignRole = ref<AssigneeRole>('资料员')

const showNewDoc = ref(false)
const newDoc = ref({ project_name: '', doc_type: '布线图' as any, assignee_name: '', assignee_role: '资料员' as AssigneeRole })

const filteredDocs = computed(() => {
  return documents.value.filter(d => {
    if (statusFilter.value && d.status !== statusFilter.value) return false
    if (roleFilter.value && d.assignee_role !== roleFilter.value) return false
    if (searchQuery.value && !d.project_name.includes(searchQuery.value)) return false
    return true
  })
})

const selectedCount = computed(() => selectedIds.value.size)
const allSelected = computed(() => filteredDocs.value.length > 0 && filteredDocs.value.every(d => selectedIds.value.has(d.id)))

function toggleSelect(id: string) {
  if (selectedIds.value.has(id)) selectedIds.value.delete(id)
  else selectedIds.value.add(id)
}

function toggleSelectAll() {
  if (allSelected.value) {
    selectedIds.value.clear()
  } else {
    filteredDocs.value.forEach(d => selectedIds.value.add(d.id))
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

async function batchSubmitReview() {
  try {
    await put('/documents/batch', {
      ids: Array.from(selectedIds.value),
      action: 'submit_review'
    })
    selectedIds.value.clear()
    await loadDocuments()
  } catch (e) {
    console.error(e)
  }
}

async function batchMarkException() {
  try {
    await put('/documents/batch', {
      ids: Array.from(selectedIds.value),
      action: 'mark_exception',
      data: { category: '其他', description: '批量标记异常' }
    })
    selectedIds.value.clear()
    await loadDocuments()
  } catch (e) {
    console.error(e)
  }
}

async function batchReassign() {
  try {
    await put('/documents/batch', {
      ids: Array.from(selectedIds.value),
      action: 'reassign',
      data: { assignee_name: reassignName.value, assignee_role: reassignRole.value }
    })
    showBatchReassign.value = false
    reassignName.value = ''
    selectedIds.value.clear()
    await loadDocuments()
  } catch (e) {
    console.error(e)
  }
}

async function createDocument() {
  try {
    await post('/documents', newDoc.value)
    showNewDoc.value = false
    newDoc.value = { project_name: '', doc_type: '布线图', assignee_name: '', assignee_role: '资料员' }
    await loadDocuments()
  } catch (e) {
    console.error(e)
  }
}

function openDrawer(doc: CompletionDocument) {
  drawerDocId.value = doc.id
  drawerOpen.value = true
  loadExceptions(doc.id)
}

function goToSignOff(docId: string) {
  router.push({ path: '/sign-off', query: { highlight: docId } })
}

async function onDrawerRefresh() {
  await loadDocuments()
  if (drawerDocId.value) {
    await loadExceptions(drawerDocId.value)
  }
}

async function loadExceptions(docId: string) {
  try {
    drawerExceptions.value = await get<any[]>(`/documents/${docId}/exceptions`)
  } catch (e) {
    console.error(e)
  }
}

function formatTime(ts: string) {
  const d = new Date(ts + 'Z')
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) + ' ' + d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

function docTypeIcon(type: string) {
  const icons: Record<string, string> = {
    '布线图': '📐', '材料领用单': '📋', '现场照片': '📷', '测试报告': '📊', '验收记录': '✅'
  }
  return icons[type] || '📄'
}

onMounted(loadDocuments)
</script>

<template>
  <div class="p-6 max-w-[1400px] mx-auto">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold text-white">竣工资料处理</h1>
        <p class="text-slate-400 text-sm mt-1">管理与处理竣工资料，备注将穿透至客户签认</p>
      </div>
      <div class="flex items-center gap-2">
        <button @click="loadDocuments" class="btn-secondary text-sm px-3 py-2">
          <RefreshCw :size="14" class="inline mr-1" />刷新
        </button>
        <button @click="showNewDoc = true" class="btn-primary text-sm px-3 py-2">
          <Plus :size="14" class="inline mr-1" />新建资料
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
      <select
        v-model="statusFilter"
        class="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
      >
        <option value="">全部状态</option>
        <option v-for="s in ['待整理', '待审核', '待签认', '已签认', '已驳回']" :key="s" :value="s">{{ s }}</option>
      </select>
      <select
        v-model="roleFilter"
        class="bg-[#1e293b] border border-[#334155] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
      >
        <option value="">全部角色</option>
        <option v-for="r in ['项目负责人', '施工班组长', '资料员']" :key="r" :value="r">{{ r }}</option>
      </select>
      <span class="text-xs text-slate-500">共 {{ filteredDocs.length }} 条</span>
    </div>

    <div v-if="selectedCount > 0" class="flex items-center gap-3 mb-4 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
      <span class="text-sm text-amber-400">已选 {{ selectedCount }} 项</span>
      <button @click="batchSubmitReview" class="btn-primary text-xs px-3 py-1.5">
        <Upload :size="12" class="inline mr-1" />批量提交审核
      </button>
      <button @click="batchMarkException" class="btn-danger text-xs px-3 py-1.5">
        <AlertTriangle :size="12" class="inline mr-1" />批量标记异常
      </button>
      <button @click="showBatchReassign = true" class="btn-secondary text-xs px-3 py-1.5">
        <UserPlus :size="12" class="inline mr-1" />批量指派
      </button>
      <button @click="selectedIds.clear()" class="text-xs text-slate-400 hover:text-white ml-auto">取消选择</button>
    </div>

    <div v-if="showBatchReassign" class="mb-4 p-4 card space-y-3">
      <div class="text-sm font-medium text-white">批量指派</div>
      <div class="flex items-center gap-3">
        <select v-model="reassignName" class="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 flex-1">
          <option value="">选择人员...</option>
          <option value="陈雪">陈雪（资料员）</option>
          <option value="王建国">王建国（项目负责人）</option>
          <option value="张伟">张伟（项目负责人）</option>
          <option value="李明辉">李明辉（项目负责人）</option>
          <option value="刘强">刘强（施工班组长）</option>
          <option value="赵刚">赵刚（施工班组长）</option>
        </select>
        <select v-model="reassignRole" class="bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
          <option v-for="r in ['项目负责人', '施工班组长', '资料员']" :key="r" :value="r">{{ r }}</option>
        </select>
        <button @click="batchReassign" :disabled="!reassignName" class="btn-primary text-sm">确认</button>
        <button @click="showBatchReassign = false" class="btn-secondary text-sm">取消</button>
      </div>
    </div>

    <div v-if="filteredDocs.length > 0" class="flex items-center gap-2 mb-3 px-1">
      <button @click="toggleSelectAll" class="text-slate-400 hover:text-white transition-colors">
        <component :is="allSelected ? CheckSquare : Square" :size="16" />
      </button>
      <span class="text-xs text-slate-500">全选</span>
    </div>

    <div v-if="!loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div
        v-for="doc in filteredDocs"
        :key="doc.id"
        class="card cursor-pointer group relative"
        @click="router.push(`/documents/${doc.id}`)"
      >
        <div class="absolute top-3 left-3 z-10" @click.stop="toggleSelect(doc.id)">
          <component
            :is="selectedIds.has(doc.id) ? CheckSquare : Square"
            :size="16"
            :class="selectedIds.has(doc.id) ? 'text-amber-400' : 'text-slate-500 opacity-0 group-hover:opacity-100'"
            class="transition-all"
          />
        </div>

        <div class="pl-7">
          <div class="flex items-start justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-lg">{{ docTypeIcon(doc.doc_type) }}</span>
              <StatusBadge :status="doc.status" />
            </div>
            <div class="flex items-center gap-1">
              <button
                v-if="doc.status === '待签认'"
                @click.stop="goToSignOff(doc.id)"
                class="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition-colors flex items-center gap-0.5"
              >
                <PenLine :size="10" />签认
              </button>
              <button
                v-if="doc.exceptions_count && doc.exceptions_count > 0"
                @click.stop="openDrawer(doc)"
                class="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center gap-0.5"
              >
                <AlertTriangle :size="10" />{{ doc.exceptions_count }}
              </button>
            </div>
          </div>

          <h3 class="text-sm font-medium text-white mb-1 truncate">{{ doc.project_name }}</h3>
          <div class="text-xs text-slate-400 mb-2">{{ doc.doc_type }}</div>

          <div class="flex items-center gap-2 text-xs text-slate-500 mb-2">
            <span>{{ doc.assignee_name }}</span>
            <span class="text-slate-600">·</span>
            <span>{{ doc.assignee_role }}</span>
          </div>

          <div v-if="doc.latest_remark" class="text-xs text-slate-400 truncate mb-2 px-2 py-1.5 bg-slate-800/50 rounded">
            {{ doc.latest_remark }}
          </div>

          <div class="flex items-center justify-between">
            <span class="text-xs text-slate-600">{{ formatTime(doc.updated_at) }}</span>
            <ChevronRight :size="14" class="text-slate-600 group-hover:text-amber-400 transition-colors" />
          </div>
        </div>
      </div>
    </div>

    <div v-if="!loading && filteredDocs.length === 0" class="text-center py-16">
      <div class="text-4xl mb-3">📂</div>
      <p class="text-slate-400">暂无竣工资料</p>
    </div>

    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div v-for="i in 6" :key="i" class="card animate-pulse">
        <div class="h-4 bg-slate-700 rounded w-3/4 mb-3"></div>
        <div class="h-3 bg-slate-700 rounded w-1/2 mb-2"></div>
        <div class="h-3 bg-slate-700 rounded w-full mb-2"></div>
        <div class="h-3 bg-slate-700 rounded w-1/3"></div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showNewDoc" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="absolute inset-0 bg-black/50" @click="showNewDoc = false"></div>
        <div class="relative w-full max-w-md bg-[#1e293b] border border-[#334155] rounded-xl p-6 shadow-2xl">
          <h2 class="text-lg font-bold text-white mb-4">新建竣工资料</h2>
          <div class="space-y-3">
            <div>
              <label class="text-xs text-slate-400 mb-1 block">项目名称</label>
              <input v-model="newDoc.project_name" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500" />
            </div>
            <div>
              <label class="text-xs text-slate-400 mb-1 block">资料类型</label>
              <select v-model="newDoc.doc_type" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                <option v-for="t in ['布线图', '材料领用单', '现场照片', '测试报告', '验收记录']" :key="t" :value="t">{{ t }}</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-400 mb-1 block">处理人</label>
              <select v-model="newDoc.assignee_name" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                <option value="">选择处理人...</option>
                <option value="陈雪">陈雪（资料员）</option>
                <option value="王建国">王建国（项目负责人）</option>
                <option value="张伟">张伟（项目负责人）</option>
                <option value="李明辉">李明辉（项目负责人）</option>
                <option value="刘强">刘强（施工班组长）</option>
                <option value="赵刚">赵刚（施工班组长）</option>
              </select>
            </div>
            <div>
              <label class="text-xs text-slate-400 mb-1 block">角色</label>
              <select v-model="newDoc.assignee_role" class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
                <option v-for="r in ['项目负责人', '施工班组长', '资料员']" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
          </div>
          <div class="flex gap-2 mt-5">
            <button @click="createDocument" :disabled="!newDoc.project_name || !newDoc.assignee_name" class="btn-primary text-sm flex-1">创建</button>
            <button @click="showNewDoc = false" class="btn-secondary text-sm">取消</button>
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
