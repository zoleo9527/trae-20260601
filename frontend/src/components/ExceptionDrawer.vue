<script setup lang="ts">
import { ref } from 'vue'
import { X, AlertTriangle, ChevronUp, ChevronDown, User, Clock } from 'lucide-vue-next'
import { useApi } from '@/composables/useApi'
import type { Exception, ExceptionCategory } from '@/types'

const props = defineProps<{
  open: boolean
  documentId: string | null
  exceptions: Exception[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'refresh'): void
}>()

const { post, put } = useApi()

const newException = ref<{ category: ExceptionCategory; description: string }>({
  category: '其他',
  description: ''
})
const showNewForm = ref(false)
const expandedId = ref<string | null>(null)

const categoryColors: Record<string, string> = {
  '资料缺失': 'bg-red-500/10 text-red-400 border-red-500/20',
  '照片不符': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  '材料领用差异': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  '布线图错误': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  '其他': 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

const statusConfig: Record<string, { bg: string; text: string }> = {
  '待处理': { bg: 'bg-red-500/10', text: 'text-red-400' },
  '处理中': { bg: 'bg-amber-500/10', text: 'text-amber-400' },
  '已解决': { bg: 'bg-emerald-500/10', text: 'text-emerald-400' },
  '已升级': { bg: 'bg-purple-500/10', text: 'text-purple-400' },
}

async function createException() {
  if (!props.documentId || !newException.value.description) return
  try {
    await post(`/documents/${props.documentId}/exceptions`, newException.value)
    newException.value = { category: '其他', description: '' }
    showNewForm.value = false
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}

async function upgradeException(excId: string) {
  if (!props.documentId) return
  try {
    await put(`/documents/${props.documentId}/exceptions/${excId}`, {
      status: '已升级',
      handler: '王建国',
      handler_role: '项目负责人',
      action: '异常升级至项目负责人',
      operator: '系统',
      operator_role: '系统'
    })
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}

async function resolveException(excId: string) {
  if (!props.documentId) return
  try {
    await put(`/documents/${props.documentId}/exceptions/${excId}`, {
      status: '已解决',
      handler: '张伟',
      handler_role: '项目负责人',
      action: '异常已解决',
      operator: '张伟',
      operator_role: '项目负责人'
    })
    emit('refresh')
  } catch (e) {
    console.error(e)
  }
}

function formatDate(ts: string) {
  return new Date(ts + 'Z').toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex justify-end">
      <div class="absolute inset-0 bg-black/50" @click="emit('close')"></div>
      <div class="relative w-[420px] max-w-full bg-[#1e293b] border-l border-[#334155] flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        <div class="flex items-center justify-between px-5 py-4 border-b border-[#334155]">
          <div class="flex items-center gap-2">
            <AlertTriangle :size="18" class="text-amber-400" />
            <span class="text-base font-medium text-white">异常处理</span>
            <span class="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">{{ exceptions.length }}</span>
          </div>
          <button @click="emit('close')" class="text-slate-400 hover:text-white transition-colors">
            <X :size="18" />
          </button>
        </div>

        <div class="flex-1 overflow-y-auto p-5 space-y-3">
          <div v-for="exc in exceptions" :key="exc.id" class="border border-[#334155] rounded-lg overflow-hidden">
            <div
              class="flex items-center justify-between p-3 cursor-pointer hover:bg-slate-700/30 transition-colors"
              @click="expandedId = expandedId === exc.id ? null : exc.id"
            >
              <div class="flex items-center gap-2 min-w-0">
                <span class="text-xs px-2 py-0.5 rounded border" :class="categoryColors[exc.category]">{{ exc.category }}</span>
                <span class="text-xs px-2 py-0.5 rounded" :class="[statusConfig[exc.status].bg, statusConfig[exc.status].text]">{{ exc.status }}</span>
              </div>
              <component :is="expandedId === exc.id ? ChevronUp : ChevronDown" :size="14" class="text-slate-500" />
            </div>

            <div v-if="expandedId === exc.id" class="px-3 pb-3 space-y-3 border-t border-[#334155]">
              <p class="text-sm text-slate-300 pt-2">{{ exc.description }}</p>

              <div v-if="exc.handler" class="flex items-center gap-2 text-xs text-slate-400">
                <User :size="12" />
                <span>{{ exc.handler }} ({{ exc.handler_role }})</span>
              </div>

              <div class="flex items-center gap-2 text-xs text-slate-500">
                <Clock :size="12" />
                <span>{{ formatDate(exc.created_at) }}</span>
              </div>

              <div v-if="exc.records.length > 0" class="space-y-1.5 pl-3 border-l-2 border-slate-700">
                <div v-for="rec in exc.records" :key="rec.id" class="text-xs">
                  <span class="text-slate-400">{{ rec.operator }}: </span>
                  <span class="text-slate-300">{{ rec.action }}</span>
                  <span class="text-slate-600 ml-2">{{ formatDate(rec.created_at) }}</span>
                </div>
              </div>

              <div class="flex gap-2 pt-1">
                <button
                  v-if="exc.status !== '已解决'"
                  @click="resolveException(exc.id)"
                  class="text-xs px-3 py-1.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors"
                >
                  标记解决
                </button>
                <button
                  v-if="exc.status !== '已升级' && exc.status !== '已解决'"
                  @click="upgradeException(exc.id)"
                  class="text-xs px-3 py-1.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors"
                >
                  升级处理
                </button>
              </div>
            </div>
          </div>

          <div v-if="exceptions.length === 0" class="text-center py-8">
            <AlertTriangle :size="32" class="text-slate-600 mx-auto mb-2" />
            <p class="text-sm text-slate-500">暂无异常记录</p>
          </div>
        </div>

        <div class="border-t border-[#334155] p-4 space-y-3">
          <button
            v-if="!showNewForm"
            @click="showNewForm = true"
            class="w-full btn-secondary text-sm py-2"
          >
            + 新增异常
          </button>

          <div v-if="showNewForm" class="space-y-2">
            <select
              v-model="newException.category"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
            >
              <option v-for="cat in ['资料缺失', '照片不符', '材料领用差异', '布线图错误', '其他']" :key="cat" :value="cat">{{ cat }}</option>
            </select>
            <textarea
              v-model="newException.description"
              placeholder="描述异常情况..."
              rows="3"
              class="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500 resize-none"
            ></textarea>
            <div class="flex gap-2">
              <button @click="createException" :disabled="!newException.description" class="btn-primary text-sm flex-1">提交</button>
              <button @click="showNewForm = false" class="btn-secondary text-sm">取消</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.animate-in {
  animation: slideIn 0.3s ease-out;
}
@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
