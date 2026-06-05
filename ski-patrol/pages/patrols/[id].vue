<template>
  <div class="p-8">
    <div class="flex items-center gap-3 mb-6">
      <button @click="navigateTo('/patrols')" class="text-slate-400 hover:text-white transition-colors">
        <ArrowLeft class="w-5 h-5" />
      </button>
      <div>
        <h1 class="text-2xl font-bold text-white">巡查详情</h1>
        <p class="text-slate-400 text-sm">{{ patrol.trailName }} · {{ patrol.type === 'daily' ? '日常巡查' : '专项巡查' }}</p>
      </div>
      <div class="ml-auto flex items-center gap-2">
        <span :class="statusBadgeClass(patrol.status)">{{ statusLabel(patrol.status) }}</span>
        <span v-if="patrol.result === 'normal'" class="badge-approved">正常</span>
        <span v-else-if="patrol.result === 'issue'" class="badge-reported">有问题</span>
      </div>
    </div>

    <div v-if="loading" class="text-center py-12">
      <Loader2 class="w-8 h-8 text-sky-400 animate-spin mx-auto" />
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-6 mb-6">
        <div class="card">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">基本信息</h3>
          <div class="space-y-2 text-sm">
            <div class="flex justify-between"><span class="text-slate-400">雪道</span><span class="text-white">{{ patrol.trailName }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">难度</span><span :class="difficultyColor(patrol.trailDifficulty)">{{ difficultyLabel(patrol.trailDifficulty) }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">类型</span><span class="text-white">{{ patrol.type === 'daily' ? '日常巡查' : '专项巡查' }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">创建人</span><span class="text-white">{{ patrol.creatorName }}</span></div>
            <div class="flex justify-between"><span class="text-slate-400">创建时间</span><span class="text-white">{{ patrol.createdAt }}</span></div>
            <div v-if="patrol.completedAt" class="flex justify-between"><span class="text-slate-400">完成时间</span><span class="text-white">{{ patrol.completedAt }}</span></div>
            <div v-if="patrol.conclusion" class="flex justify-between"><span class="text-slate-400">巡查结论</span><span class="text-white">{{ patrol.conclusion }}</span></div>
          </div>
        </div>

        <div class="card">
          <h3 class="text-sm font-semibold text-slate-300 mb-3">关联风险</h3>
          <div v-if="patrol.risks && patrol.risks.length > 0" class="space-y-2">
            <NuxtLink
              v-for="risk in patrol.risks"
              :key="risk.id"
              :to="`/risks/${risk.id}`"
              class="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 hover:bg-slate-700/50 transition-all"
            >
              <span class="badge" :class="levelBadgeClass(risk.level)">{{ levelLabel(risk.level) }}</span>
              <span class="text-sm text-white flex-1 truncate">{{ risk.description }}</span>
              <span :class="riskStatusBadgeClass(risk.status)">{{ riskStatusLabel(risk.status) }}</span>
            </NuxtLink>
          </div>
          <p v-else class="text-slate-500 text-sm">暂无关联风险</p>
        </div>
      </div>

      <div v-if="patrol.status === 'pending'" class="card mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <Clock class="w-5 h-5 text-amber-400" />
            <span class="text-white font-medium">待开始巡查</span>
          </div>
          <button @click="handleStart" :disabled="submitting" class="btn-primary">
            {{ submitting ? '处理中...' : '开始巡查' }}
          </button>
        </div>
      </div>

      <div v-if="patrol.status === 'in_progress'" class="card mb-6">
        <h3 class="text-sm font-semibold text-slate-300 mb-4">处理巡查</h3>
        <div class="space-y-4">
          <div>
            <label class="label-text">巡查结论</label>
            <textarea v-model="conclusion" rows="3" class="input-field w-full" placeholder="请输入巡查结论..."></textarea>
          </div>
          <div>
            <label class="label-text">巡查结果</label>
            <div class="flex gap-3">
              <button
                @click="result = 'normal'"
                class="flex-1 py-3 rounded-lg border text-sm font-medium transition-all"
                :class="result === 'normal' ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                ✓ 正常
              </button>
              <button
                @click="result = 'issue'"
                class="flex-1 py-3 rounded-lg border text-sm font-medium transition-all"
                :class="result === 'issue' ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' : 'bg-slate-700/30 border-slate-600 text-slate-400 hover:border-slate-500'"
              >
                ⚠ 有问题
              </button>
            </div>
          </div>
          <div class="flex gap-3">
            <button @click="handleComplete" :disabled="submitting || !conclusion || !result" class="btn-primary flex-1 disabled:opacity-50">
              {{ submitting ? '提交中...' : '提交巡查结果' }}
            </button>
            <button v-if="result === 'issue'" @click="handleCompleteAndReport" :disabled="submitting || !conclusion" class="btn-danger flex-1 disabled:opacity-50">
              提交并上报风险
            </button>
          </div>
        </div>
      </div>

      <div v-if="patrol.status === 'completed'" class="card mb-6">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <CheckCircle2 class="w-5 h-5 text-emerald-400" />
            <span class="text-white font-medium">巡查已完成</span>
          </div>
          <div class="flex gap-3">
            <button v-if="patrol.result === 'issue' && (!patrol.risks || patrol.risks.length === 0)" @click="navigateTo(`/risks/new?patrolId=${patrol.id}`)" class="btn-danger">
              上报风险
            </button>
            <button @click="handleArchive" class="btn-secondary">归档</button>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-semibold text-slate-300 mb-4">操作日志</h3>
        <div class="relative pl-6 space-y-4">
          <div v-for="(log, i) in patrol.auditLogs" :key="log.id" class="relative">
            <div class="absolute -left-6 top-1 w-3 h-3 rounded-full border-2"
                 :class="i === patrol.auditLogs.length - 1 ? 'bg-sky-400 border-sky-400' : 'bg-slate-600 border-slate-600'"></div>
            <div class="ml-4">
              <p class="text-sm text-white">{{ log.action === 'create' ? '创建巡查单' : log.action === 'start' ? '开始巡查' : log.action === 'complete' ? '完成巡查' : log.action === 'archive' ? '归档' : log.action === 'risk_reported' ? '关联风险上报' : log.action }}</p>
              <p class="text-xs text-slate-400 mt-0.5">{{ log.operatorName }} · {{ log.createdAt }}</p>
              <p v-if="log.detail" class="text-xs text-slate-500 mt-1">{{ log.detail }}</p>
            </div>
          </div>
          <div v-if="patrol.auditLogs && patrol.auditLogs.length === 0" class="text-slate-500 text-sm ml-4">暂无操作日志</div>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, Loader2, CheckCircle2, Clock } from 'lucide-vue-next'

const route = useRoute()
const patrol = ref<any>({})
const loading = ref(true)
const submitting = ref(false)
const conclusion = ref('')
const result = ref<'normal' | 'issue' | ''>('')

async function loadPatrol() {
  loading.value = true
  try {
    patrol.value = await $fetch(`/api/patrols/${route.params.id}`) as any
  } catch (e) {
    console.error('加载巡查详情失败', e)
  } finally {
    loading.value = false
  }
}

async function handleStart() {
  submitting.value = true
  try {
    await $fetch(`/api/patrols/${route.params.id}/start`, { method: 'PUT' })
    await loadPatrol()
  } catch (e) {
    console.error('开始巡查失败', e)
  } finally {
    submitting.value = false
  }
}

async function handleComplete() {
  if (!conclusion.value || !result.value) return
  submitting.value = true
  try {
    await $fetch(`/api/patrols/${route.params.id}/complete`, {
      method: 'PUT',
      body: { result: result.value, conclusion: conclusion.value },
    })
    await loadPatrol()
    conclusion.value = ''
    result.value = ''
  } catch (e) {
    console.error('提交巡查结果失败', e)
  } finally {
    submitting.value = false
  }
}

async function handleCompleteAndReport() {
  if (!conclusion.value || result.value !== 'issue') return
  submitting.value = true
  try {
    await $fetch(`/api/patrols/${route.params.id}/complete`, {
      method: 'PUT',
      body: { result: 'issue', conclusion: conclusion.value },
    })
    navigateTo(`/risks/new?patrolId=${route.params.id}`)
  } catch (e) {
    console.error('提交失败', e)
  } finally {
    submitting.value = false
  }
}

async function handleArchive() {
  try {
    await $fetch(`/api/patrols/${route.params.id}/archive`, { method: 'PUT' })
    await loadPatrol()
  } catch (e) {
    console.error('归档失败', e)
  }
}

function difficultyLabel(d: string) {
  const map: Record<string, string> = { beginner: '初级', intermediate: '中级', advanced: '高级', expert: '专家' }
  return map[d] || d
}

function difficultyColor(d: string) {
  const map: Record<string, string> = { beginner: 'text-emerald-400', intermediate: 'text-sky-400', advanced: 'text-amber-400', expert: 'text-red-400' }
  return map[d] || ''
}

function statusLabel(s: string) {
  const map: Record<string, string> = { pending: '待巡查', in_progress: '进行中', completed: '已完成', archived: '已归档' }
  return map[s] || s
}

function statusBadgeClass(s: string) {
  const map: Record<string, string> = { pending: 'badge-pending', in_progress: 'badge-progress', completed: 'badge-completed', archived: 'badge-archived' }
  return map[s] || 'badge'
}

function levelLabel(l: string) {
  const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' }
  return map[l] || l
}

function levelBadgeClass(l: string) {
  const map: Record<string, string> = { low: 'bg-sky-500/20 text-sky-400', medium: 'bg-amber-500/20 text-amber-400', high: 'bg-orange-500/20 text-orange-400', critical: 'bg-red-500/20 text-red-400' }
  return map[l] || ''
}

function riskStatusLabel(s: string) {
  const map: Record<string, string> = { reported: '已上报', approved: '已审批', rejected: '已退回', resubmitted: '已重提', archived: '已归档' }
  return map[s] || s
}

function riskStatusBadgeClass(s: string) {
  const map: Record<string, string> = { reported: 'badge-reported', approved: 'badge-approved', rejected: 'badge-rejected', resubmitted: 'badge-resubmitted', archived: 'badge-archived' }
  return map[s] || 'badge'
}

onMounted(loadPatrol)
</script>
