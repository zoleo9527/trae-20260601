<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, MessageSquare, AlertTriangle, Check, X, Clock, User, FileText, ChevronRight, PenLine, ExternalLink } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import StatusBadge from '@/components/StatusBadge.vue'
import ExceptionDrawer from '@/components/ExceptionDrawer.vue'
import type { DocumentDetail, DocStatus } from '@/types'

const route = useRoute()
const router = useRouter()
const { get, post, put } = useApi()

const doc = ref<DocumentDetail | null>(null)
const loading = ref(true)

const newRemark = ref('')
const remarkAuthor = ref('陈雪')
const remarkRole = ref('资料员')

const drawerOpen = ref(false)

const statusActions = computed(() => {
  if (!doc.value) return []
  const s = doc.value.status
  const actions: Array<{ label: string; target?: DocStatus; class: string; navigate?: string }> = []
  if (s === '待整理') actions.push({ label: '提交审核', target: '待审核', class: 'btn-primary' })
  if (s === '待审核') {
    actions.push({ label: '审核通过', target: '待签认', class: 'btn-success' })
    actions.push({ label: '驳回', target: '已驳回', class: 'btn-danger' })
  }
  if (s === '已驳回') actions.push({ label: '重新提交', target: '待整理', class: 'btn-primary' })
  if (s === '待签认') {
    actions.push({ label: '去签认页', class: 'btn-primary', navigate: '/sign-off' })
  }
  if (s === '已签认') {
    actions.push({ label: '查看签认', class: 'btn-secondary', navigate: '/sign-off' })
  }
  return actions
})

const stageColors: Record<string, string> = {
  '整理': 'bg-blue-500',
  '审核': 'bg-amber-500',
  '签认': 'bg-emerald-500',
  '异常处理': 'bg-red-500',
}

function getStageColor(stage: string) {
  return stageColors[stage] || 'bg-slate-500'
}

async function loadDoc() {
  loading.value = true
  try {
    doc.value = await get<DocumentDetail>(`/documents/${route.params.id}`)
  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

async function addRemark() {
  if (!doc.value || !newRemark.value) return
  try {
    await post(`/documents/${doc.value.id}/remarks`, {
      content: newRemark.value,
      author: remarkAuthor.value,
      author_role: remarkRole.value
    })
    newRemark.value = ''
    await loadDoc()
  } catch (e) {
    console.error(e)
  }
}

async function changeStatus(target: DocStatus) {
  if (!doc.value) return
  try {
    await put(`/documents/${doc.value.id}`, { status: target })
    await loadDoc()
  } catch (e) {
    console.error(e)
  }
}

function handleAction(action: { label: string; target?: DocStatus; class: string; navigate?: string }) {
  if (action.navigate) {
    router.push(action.navigate)
  } else if (action.target) {
    changeStatus(action.target)
  }
}

function formatTime(ts: string) {
  return new Date(ts + 'Z').toLocaleString('zh-CN')
}

onMounted(loadDoc)
</script>

<template>
  <div class="p-6 max-w-[900px] mx-auto">
    <button @click="router.push('/documents')" class="flex items-center gap-1 text-sm text-slate-400 hover:text-white mb-4 transition-colors">
      <ArrowLeft :size="16" /> 返回列表
    </button>

    <div v-if="!loading && doc" class="space-y-5">
      <div class="card">
        <div class="flex items-start justify-between mb-3">
          <div>
            <h1 class="text-xl font-bold text-white mb-1">{{ doc.project_name }}</h1>
            <div class="flex items-center gap-2 text-sm text-slate-400">
              <FileText :size="14" />
              <span>{{ doc.doc_type }}</span>
            </div>
          </div>
          <StatusBadge :status="doc.status" />
        </div>
        <div class="grid grid-cols-3 gap-4 text-xs">
          <div>
            <span class="text-slate-500">处理人</span>
            <div class="text-slate-300 mt-1">{{ doc.assignee_name }} ({{ doc.assignee_role }})</div>
          </div>
          <div>
            <span class="text-slate-500">创建时间</span>
            <div class="text-slate-300 mt-1">{{ formatTime(doc.created_at) }}</div>
          </div>
          <div>
            <span class="text-slate-500">更新时间</span>
            <div class="text-slate-300 mt-1">{{ formatTime(doc.updated_at) }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center gap-2 mb-4">
          <MessageSquare :size="16" class="text-slate-400" />
          <span class="text-sm font-medium text-slate-300">处理备注</span>
          <span class="text-xs text-slate-500">（全流程穿透 · 含客户签认意见）</span>
        </div>

        <div class="space-y-3 pl-4 border-l-2 border-slate-700 mb-4">
          <div v-for="remark in doc.remarks" :key="remark.id" class="relative pl-4">
            <div
              class="absolute left-[-21px] top-1 w-2.5 h-2.5 rounded-full"
              :class="getStageColor(remark.stage)"
            ></div>
            <div class="flex items-center gap-2 mb-1 flex-wrap">
              <span class="text-xs px-1.5 py-0.5 rounded text-slate-300" :class="getStageColor(remark.stage) + '/10'">
                {{ remark.stage }}
              </span>
              <span class="text-xs text-slate-300">{{ remark.author }}</span>
              <span class="text-xs text-slate-600">{{ remark.author_role }}</span>
              <span class="text-xs text-slate-600">{{ formatTime(remark.created_at) }}</span>
            </div>
            <p class="text-sm text-slate-300">{{ remark.content }}</p>
          </div>
          <div v-if="doc.remarks.length === 0" class="text-xs text-slate-500 pl-4">暂无备注</div>
        </div>

        <div class="flex gap-2 pt-3 border-t border-[#334155]">
          <div class="flex-1">
            <input
              v-model="newRemark"
              placeholder="添加备注（将穿透至客户签认）..."
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              @keydown.enter="addRemark"
            />
          </div>
          <select v-model="remarkAuthor" class="bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
            <option value="陈雪">陈雪（资料员）</option>
            <option value="王建国">王建国（项目负责人）</option>
            <option value="张伟">张伟（项目负责人）</option>
            <option value="李明辉">李明辉（项目负责人）</option>
            <option value="刘强">刘强（施工班组长）</option>
            <option value="赵刚">赵刚（施工班组长）</option>
          </select>
          <select v-model="remarkRole" class="bg-slate-700 border border-slate-600 rounded-lg px-2 py-2 text-xs text-white focus:outline-none focus:border-amber-500">
            <option value="资料员">资料员</option>
            <option value="项目负责人">项目负责人</option>
            <option value="施工班组长">施工班组长</option>
          </select>
          <button @click="addRemark" :disabled="!newRemark" class="btn-primary text-sm px-4">发送</button>
        </div>
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <AlertTriangle :size="16" class="text-amber-400" />
            <span class="text-sm font-medium text-slate-300">异常记录</span>
            <span class="text-xs px-2 py-0.5 rounded-full" :class="doc.exceptions.length > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-500/10 text-slate-400'">{{ doc.exceptions.length }}</span>
          </div>
          <button @click="drawerOpen = true" class="text-xs text-amber-400 hover:text-amber-300 transition-colors">打开异常抽屉 →</button>
        </div>
        <div v-if="doc.exceptions.length === 0" class="text-xs text-slate-500 text-center py-2">暂无异常</div>
      </div>

      <div v-if="doc.signOffs && doc.signOffs.length > 0" class="card">
        <div class="flex items-center gap-2 mb-3">
          <Check :size="16" class="text-emerald-400" />
          <span class="text-sm font-medium text-slate-300">签认记录</span>
        </div>
        <div class="space-y-2">
          <div v-for="so in doc.signOffs" :key="so.id" class="flex items-center justify-between py-2 px-3 rounded" :class="so.result === '已签认' ? 'bg-emerald-500/5' : 'bg-red-500/5'">
            <div class="flex items-center gap-2">
              <component :is="so.result === '已签认' ? Check : X" :size="14" :class="so.result === '已签认' ? 'text-emerald-400' : 'text-red-400'" />
              <span class="text-sm" :class="so.result === '已签认' ? 'text-emerald-400' : 'text-red-400'">{{ so.result }}</span>
              <span class="text-xs text-slate-400">{{ so.client_name }}</span>
            </div>
            <div class="text-right">
              <div v-if="so.comment" class="text-xs text-slate-400">{{ so.comment }}</div>
              <div class="text-xs text-slate-600">{{ formatTime(so.signed_at) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="statusActions.length > 0" class="flex gap-3 pt-2">
        <button
          v-for="action in statusActions"
          :key="action.label"
          @click="handleAction(action)"
          :class="action.class"
          class="text-sm flex items-center gap-1"
        >
          <ExternalLink v-if="action.navigate" :size="12" />
          {{ action.label }}
        </button>
      </div>
    </div>

    <div v-if="loading" class="space-y-4">
      <div class="card animate-pulse"><div class="h-8 bg-slate-700 rounded w-1/2 mb-3"></div><div class="h-4 bg-slate-700 rounded w-1/3"></div></div>
      <div class="card animate-pulse"><div class="h-4 bg-slate-700 rounded w-3/4 mb-2"></div><div class="h-4 bg-slate-700 rounded w-1/2"></div></div>
    </div>

    <ExceptionDrawer
      v-if="doc"
      :open="drawerOpen"
      :document-id="doc.id"
      :exceptions="doc.exceptions"
      @close="drawerOpen = false"
      @refresh="loadDoc()"
    />
  </div>
</template>
