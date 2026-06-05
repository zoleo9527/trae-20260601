<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <button @click="navigateTo('/risks')" class="text-slate-400 hover:text-white transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-white">风险详情</h1>
        <p class="text-slate-400 text-sm">{{ risk.trailName }} · {{ risk.createdAt }}</p>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <span class="badge" :class="levelBadgeClass(risk.level)">{{ levelLabel(risk.level) }}</span>
        <span :class="statusBadgeClass(risk.status)">{{ statusLabel(risk.status) }}</span>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <Loader2 class="w-8 h-8 text-orange-400 animate-spin mx-auto" />
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">风险信息</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-400">风险等级</span><span :class="levelTextColor(risk.level)">{{ levelLabel(risk.level) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">紧急程度</span><span class="text-white">{{ urgencyLabel(risk.urgency) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">上报人</span><span class="text-white">{{ risk.creatorName }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">上报时间</span><span class="text-white">{{ risk.createdAt }}</span></div>
            <div v-if="risk.resolvedAt" class="flex justify-between"><span class="text-slate-400">处理时间</span><span class="text-white">{{ risk.resolvedAt }}</span></div>
            <div class="mt-3 pt-3 border-t border-slate-700">
              <p class="text-slate-400 mb-1">风险描述</p>
              <p class="text-white text-sm leading-relaxed">{{ risk.description }}</p>
            </div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">关联巡查</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-400">雪道</span><span class="text-white">{{ risk.trailName }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">难度</span><span :class="difficultyColor(risk.trailDifficulty)">{{ difficultyLabel(risk.trailDifficulty) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">巡查结果</span>
              <span v-if="risk.patrolResult === 'normal'" class="text-emerald-400">正常</span>
              <span v-else-if="risk.patrolResult === 'issue'" class="text-orange-400">有问题</span>
            </div>
            <div v-if="risk.patrolConclusion" class="mt-3 pt-3 border-t border-slate-700">
              <p class="text-slate-400 mb-1">巡查结论</p>
              <p class="text-white text-sm">{{ risk.patrolConclusion }}</p>
            </div>
          </div>
          <NuxtLink :to="`/patrols/${risk.patrolId}`" class="inline-flex items-center gap-1 text-sky-400 text-sm mt-4 hover:text-sky-300 transition-colors">
            查看巡查详情 <ChevronRight class="w-3 h-3" />
          </NuxtLink>
        </div>
      </div>

      <div v-if="risk.approveAction" class="card mb-6">
        <h3 class="text-sm font-semibold text-emerald-400 mb-3">审批结果</h3>
        <div class="space-y-2 text-sm">
          <div class="flex justify-between"><span class="text-slate-400">处理方式</span><span class="text-white">{{ risk.approveAction === 'reschedule' ? '改期' : '补录' }}</span></div>
          <div v-if="risk.approveNote" class="flex justify-between"><span class="text-slate-400">审批备注</span><span class="text-white">{{ risk.approveNote }}</span></div>
        </div>
      </div>

      <div v-if="risk.rejectReason" class="card mb-6 border-red-500/20">
        <h3 class="text-sm font-semibold text-red-400 mb-3">退回原因</h3>
        <p class="text-white text-sm">{{ risk.rejectReason }}</p>
      </div>

      <div v-if="risk.supplementNote" class="card mb-6 border-purple-500/20">
        <h3 class="text-sm font-semibold text-purple-400 mb-3">补充备注</h3>
        <p class="text-white text-sm">{{ risk.supplementNote }}</p>
      </div>

      <div v-if="risk.status === 'reported' || risk.status === 'resubmitted'" class="card mb-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-4">审批操作</h3>
        <div class="space-y-4">
          <div>
            <label class="label-text">审批方式</label>
            <div class="flex gap-3">
              <button
                @click="approveAction = 'reschedule'"
                class="flex-1 py-3 rounded-lg border text-sm font-medium transition-all"
                :class="approveAction === 'reschedule' ? 'bg-sky-500/20 border-sky-500/50 text-sky-400' : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                改期
              </button>
              <button
                @click="approveAction = 'supplement'"
                class="flex-1 py-3 rounded-lg border text-sm font-medium transition-all"
                :class="approveAction === 'supplement' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                补录
              </button>
            </div>
          </div>
          <div>
            <label class="label-text">审批备注</label>
            <textarea v-model="approveNote" rows="2" class="input-field w-full" placeholder="可选填写审批备注..."></textarea>
          </div>
          <div class="flex gap-3">
            <button @click="handleApprove" :disabled="approving || !approveAction" class="btn-success flex-1 disabled:opacity-50">
              {{ approving ? '处理中...' : '通过' }}
            </button>
            <button @click="showRejectModal = true" class="btn-danger flex-1">
              退回
            </button>
          </div>
        </div>
      </div>

      <div v-if="risk.status === 'rejected'" class="card mb-6 border-red-500/20">
        <h3 class="text-sm font-semibold text-red-400 mb-4">重新提交</h3>
        <div class="space-y-4">
          <div>
            <label class="label-text">补充备注</label>
            <textarea v-model="supplementNote" rows="3" class="input-field w-full" placeholder="请填写补充说明..."></textarea>
          </div>
          <button @click="handleResubmit" :disabled="resubmitting || !supplementNote" class="btn-primary w-full disabled:opacity-50">
            {{ resubmitting ? '提交中...' : '补充备注并重新提交' }}
          </button>
        </div>
      </div>

      <div v-if="risk.status === 'approved'" class="card mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <CheckCircle2 class="w-5 h-5 text-emerald-400" />
            <span class="text-white font-medium">风险已审批</span>
          </div>
          <button @click="handleArchive" class="btn-secondary">归档</button>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-slate-300 mb-4">完整操作日志</h3>
        <div class="relative pl-6 space-y-4">
          <template v-if="risk.patrolAuditLogs && risk.patrolAuditLogs.length > 0">
            <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">巡查阶段</p>
            <div v-for="log in risk.patrolAuditLogs" :key="'p-' + log.id" class="relative">
              <div class="absolute -left-6 top-1 w-3 h-3 rounded-full bg-sky-400/50 border-2 border-sky-400/50"></div>
              <div class="ml-4">
                <p class="text-sm text-white">{{ actionLabel(log.action) }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ log.operatorName }} · {{ log.createdAt }}</p>
                <p v-if="log.detail" class="text-xs text-slate-500 mt-1">{{ log.detail }}</p>
              </div>
            </div>
          </template>

          <template v-if="risk.auditLogs && risk.auditLogs.length > 0">
            <p class="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2 mt-4">风险阶段</p>
            <div v-for="(log, i) in risk.auditLogs" :key="log.id" class="relative">
              <div class="absolute -left-6 top-1 w-3 h-3 rounded-full"
                   :class="i === risk.auditLogs.length - 1 ? 'bg-orange-400 border-orange-400' : 'bg-orange-400/50 border-orange-400/50'"></div>
              <div class="ml-4">
                <p class="text-sm text-white">{{ actionLabel(log.action) }}</p>
                <p class="text-xs text-slate-400 mt-0.5">{{ log.operatorName }} · {{ log.createdAt }}</p>
                <p v-if="log.detail" class="text-xs text-slate-500 mt-1">{{ log.detail }}</p>
              </div>
            </div>
          </template>

          <div v-if="(!risk.auditLogs || risk.auditLogs.length === 0) && (!risk.patrolAuditLogs || risk.patrolAuditLogs.length === 0)" class="text-slate-500 text-sm ml-4">暂无操作日志</div>
        </div>
      </div>
    </template>

    <div v-if="showRejectModal" class="fixed inset-0 bg-black/60 flex items-center justify-center z-50" @click.self="showRejectModal = false">
      <div class="bg-slate-800 rounded-xl p-6 w-full max-w-md border border-slate-700">
        <h3 class="text-lg font-semibold text-white mb-4">退回风险上报</h3>
        <div class="mb-4">
          <label class="label-text">退回原因</label>
          <textarea v-model="rejectReason" rows="3" class="input-field w-full" placeholder="请填写退回原因..."></textarea>
        </div>
        <div class="flex gap-3">
          <button @click="showRejectModal = false" class="btn-secondary flex-1">取消</button>
          <button @click="handleReject" :disabled="!rejectReason" class="btn-danger flex-1 disabled:opacity-50">确认退回</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ChevronRight, Loader2, CheckCircle2 } from 'lucide-vue-next'

const route = useRoute()
const risk = ref<any>({})
const loading = ref(true)
const approving = ref(false)
const resubmitting = ref(false)
const approveAction = ref<'reschedule' | 'supplement' | ''>('')
const approveNote = ref('')
const supplementNote = ref('')
const showRejectModal = ref(false)
const rejectReason = ref('')

async function loadRisk() {
  loading.value = true
  try {
    risk.value = await $fetch(`/api/risks/${route.params.id}`) as any
  } catch (e) {
    console.error('加载风险详情失败', e)
  } finally {
    loading.value = false
  }
}

async function handleApprove() {
  if (!approveAction.value) return
  approving.value = true
  try {
    await $fetch(`/api/risks/${route.params.id}/approve`, {
      method: 'PUT',
      body: { action: approveAction.value, note: approveNote.value },
    })
    await loadRisk()
    approveAction.value = ''
    approveNote.value = ''
  } catch (e) {
    console.error('审批失败', e)
  } finally {
    approving.value = false
  }
}

async function handleReject() {
  if (!rejectReason.value) return
  try {
    await $fetch(`/api/risks/${route.params.id}/reject`, {
      method: 'PUT',
      body: { reason: rejectReason.value },
    })
    showRejectModal.value = false
    rejectReason.value = ''
    await loadRisk()
  } catch (e) {
    console.error('退回失败', e)
  }
}

async function handleResubmit() {
  if (!supplementNote.value) return
  resubmitting.value = true
  try {
    await $fetch(`/api/risks/${route.params.id}/resubmit`, {
      method: 'PUT',
      body: { supplementNote: supplementNote.value },
    })
    await loadRisk()
    supplementNote.value = ''
  } catch (e) {
    console.error('重新提交失败', e)
  } finally {
    resubmitting.value = false
  }
}

async function handleArchive() {
  try {
    await $fetch(`/api/risks/${route.params.id}/archive`, { method: 'PUT' })
    await loadRisk()
  } catch (e) {
    console.error('归档失败', e)
  }
}

function actionLabel(action: string) {
  const map: Record<string, string> = {
    create: '创建巡查单', start: '开始巡查', complete: '完成巡查', archive: '归档', risk_reported: '关联风险上报',
    report: '上报风险', approve: '审批通过', reject: '退回', resubmit: '重新提交',
  }
  return map[action] || action
}

function levelLabel(l: string) {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
  return map[l] || l
}

function levelBadgeClass(l: string) {
  const map: Record<string, string> = { low: 'bg-sky-500/20 text-sky-400', medium: 'bg-amber-500/20 text-amber-400', high: 'bg-orange-500/20 text-orange-400', critical: 'bg-red-500/20 text-red-400' }
  return map[l] || ''
}

function levelTextColor(l: string) {
  const map: Record<string, string> = { low: 'text-sky-400', medium: 'text-amber-400', high: 'text-orange-400', critical: 'text-red-400' }
  return map[l] || ''
}

function urgencyLabel(u: string) {
  const map: Record<string, string> = { normal: '常规', urgent: '紧急', immediate: '立即' }
  return map[u] || u
}

function statusLabel(s: string) {
  const map: Record<string, string> = { reported: '已上报', approved: '已审批', rejected: '已退回', resubmitted: '已重提', archived: '已归档' }
  return map[s] || s
}

function statusBadgeClass(s: string) {
  const map: Record<string, string> = { reported: 'badge-reported', approved: 'badge-approved', rejected: 'badge-rejected', resubmitted: 'badge-resubmitted', archived: 'badge-archived' }
  return map[s] || 'badge'
}

function difficultyLabel(d: string) {
  const map: Record<string, string> = { beginner: '初级', intermediate: '中级', advanced: '高级', expert: '专家' }
  return map[d] || d
}

function difficultyColor(d: string) {
  const map: Record<string, string> = { beginner: 'text-emerald-400', intermediate: 'text-sky-400', advanced: 'text-amber-400', expert: 'text-red-400' }
  return map[d] || ''
}

onMounted(loadRisk)
</script>
