<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft, AlertTriangle } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import RoleBadge from '@/components/RoleBadge.vue'
import StatusFlow from '@/components/StatusFlow.vue'
import Timeline from '@/components/Timeline.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const api = useApi()

const assessmentId = Number(route.params.id)
const assessment = ref<any>(null)
const loading = ref(true)

const healthScore = ref(5)
const cullRecommend = ref(false)
const assessmentRemark = ref('')
const actionRemark = ref('')
const acting = ref(false)
const errorMsg = ref('')

const canAssess = computed(() => auth.role === '兽医' && assessment.value?.status === 'pending_assessment')
const canApprove = computed(() => auth.role === '场长' && assessment.value?.status === 'pending_approval')
const hasAction = computed(() => canAssess.value || canApprove.value)

const responsibilityHint = computed(() => {
  const a = assessment.value
  if (!a) return null
  const s = a.status
  const r = auth.role
  if (s === 'pending_assessment' && r !== '兽医') {
    return { text: '当前步骤需由兽医进行健康评估', role: '兽医' }
  }
  if (s === 'pending_approval' && r !== '场长') {
    return { text: '当前步骤需由场长审批淘汰决定', role: '场长' }
  }
  return null
})

const canViewTransfer = computed(() => auth.role === '繁育员' || auth.role === '场长')

async function fetchDetail() {
  loading.value = true
  try {
    const res = await api.getAssessmentDetail(assessmentId)
    assessment.value = res.data || res
    if (assessment.value.health_score != null) healthScore.value = assessment.value.health_score
    if (assessment.value.cull_recommend != null) cullRecommend.value = !!assessment.value.cull_recommend
  } catch {
    assessment.value = null
  } finally {
    loading.value = false
  }
}

async function handleAssess() {
  acting.value = true
  errorMsg.value = ''
  try {
    await api.createAssessment(assessment.value.transfer_id, {
      healthScore: healthScore.value,
      cullRecommend: cullRecommend.value,
      remark: assessmentRemark.value,
    })
    await fetchDetail()
  } catch (e: any) {
    errorMsg.value = e.message || '提交失败'
  } finally {
    acting.value = false
  }
}

async function handleApprove(approved: boolean) {
  acting.value = true
  errorMsg.value = ''
  try {
    await api.approveAssessment(assessmentId, approved, actionRemark.value || undefined)
    await fetchDetail()
  } catch (e: any) {
    errorMsg.value = e.message || '操作失败'
  } finally {
    acting.value = false
  }
}

const remarks = computed(() => {
  if (!assessment.value) return []
  const list: any[] = []
  const t = assessment.value.transfer
  if (t) {
    if (t.remark) {
      list.push({ author: t.operator, role: '繁育员', content: t.remark, time: t.created_at, phase: '转栏申请' })
    }
  }
  if (assessment.value.vet_remark) {
    list.push({ author: assessment.value.vet_name, role: '兽医', content: assessment.value.vet_remark, time: assessment.value.assessed_at, phase: '健康评估' })
  }
  if (assessment.value.approval_remark) {
    list.push({ author: assessment.value.approver_name, role: '场长', content: assessment.value.approval_remark, time: assessment.value.approved_at, phase: '审批决定' })
  }
  return list
})

function goTransfer(id: number) {
  router.push(`/transfer/${id}`)
}

onMounted(fetchDetail)
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h2 class="text-xl font-semibold text-slate-100">评估详情</h2>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">加载中...</div>
    <div v-else-if="!assessment" class="text-center py-12 text-slate-500">记录不存在</div>
    <template v-else>
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-lg font-bold text-slate-100">{{ assessment.ear_tag }}</span>
          <StatusBadge :status="assessment.status" />
        </div>

        <StatusFlow
          :status="assessment.status"
          :next-action="assessment.nextAction || ''"
          :next-responsible="assessment.nextResponsible || ''"
          :is-overdue="assessment.isOverdue || false"
          :hours-left="assessment.hoursLeft"
        />
      </div>

      <div class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-slate-300">转栏信息</h3>
          <button
            v-if="assessment.transfer && canViewTransfer"
            class="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            @click="goTransfer(assessment.transfer_id)"
          >
            查看转栏详情 →
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-slate-500">品种</div>
            <div class="text-slate-200 mt-0.5">{{ assessment.breed }}</div>
          </div>
          <div>
            <div class="text-slate-500">日龄</div>
            <div class="text-slate-200 mt-0.5">{{ assessment.age_days }}天</div>
          </div>
          <div>
            <div class="text-slate-500">栏位</div>
            <div class="text-slate-200 mt-0.5">{{ assessment.from_pen }} → {{ assessment.to_pen }}</div>
          </div>
        </div>
      </div>

      <div v-if="canAssess" class="card space-y-4">
        <h3 class="text-sm font-medium text-slate-300">健康评估</h3>
        <div v-if="errorMsg" class="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>
        <div v-if="assessment.isOverdue" class="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle :size="14" />
          该评估已超时，请尽快完成
        </div>
        <div>
          <label class="block text-sm text-slate-400 mb-2">健康评分: {{ healthScore }}</label>
          <input v-model.number="healthScore" type="range" min="1" max="10" class="w-full accent-emerald-500" />
          <div class="flex justify-between text-xs text-slate-600 mt-1">
            <span>1 (差)</span>
            <span>10 (优)</span>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <span class="text-sm text-slate-400">淘汰建议</span>
          <button
            :class="[
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              cullRecommend ? 'bg-red-600 text-white' : 'bg-slate-700 text-slate-400'
            ]"
            @click="cullRecommend = true"
          >
            建议淘汰
          </button>
          <button
            :class="[
              'px-4 py-1.5 rounded-lg text-sm font-medium transition-colors',
              !cullRecommend ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-400'
            ]"
            @click="cullRecommend = false"
          >
            建议留养
          </button>
        </div>
        <textarea v-model="assessmentRemark" class="input-field min-h-[60px] resize-y" placeholder="评估备注（请详细说明评估依据）" />
        <button class="btn-primary" :disabled="acting" @click="handleAssess">
          {{ acting ? '提交中...' : '提交评估' }}
        </button>
      </div>

      <div v-if="assessment.health_score != null && !canAssess" class="card">
        <h3 class="text-sm font-medium text-slate-300 mb-3">评估结果</h3>
        <div class="grid grid-cols-2 gap-4 text-sm">
          <div>
            <div class="text-slate-500">健康评分</div>
            <div class="text-slate-200 mt-0.5 text-lg font-semibold">{{ assessment.health_score }} / 10</div>
          </div>
          <div>
            <div class="text-slate-500">淘汰建议</div>
            <div class="mt-0.5">
              <span v-if="assessment.cull_recommend" class="inline-flex items-center gap-1 text-red-400">
                <AlertTriangle :size="14" /> 建议淘汰
              </span>
              <span v-else class="text-emerald-400">建议留养</span>
            </div>
          </div>
          <div v-if="assessment.vet_name">
            <div class="text-slate-500">评估兽医</div>
            <div class="text-slate-200 mt-0.5">{{ assessment.vet_name }}</div>
          </div>
          <div v-if="assessment.assessed_at">
            <div class="text-slate-500">评估时间</div>
            <div class="text-slate-200 mt-0.5">{{ assessment.assessed_at }}</div>
          </div>
        </div>
      </div>

      <div v-if="canApprove" class="card space-y-4">
        <h3 class="text-sm font-medium text-slate-300">审批操作</h3>
        <div v-if="errorMsg" class="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>
        <div v-if="assessment.isOverdue" class="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2 flex items-center gap-2">
          <AlertTriangle :size="14" />
          该审批已超时，请尽快处理
        </div>
        <div class="bg-slate-800/50 rounded-lg px-4 py-3">
          <div class="text-sm text-slate-400">
            兽医 {{ assessment.vet_name }} 建议：
            <span :class="assessment.cull_recommend ? 'text-red-400' : 'text-emerald-400'">
              {{ assessment.cull_recommend ? '淘汰' : '留养' }}
            </span>
            （健康评分 {{ assessment.health_score }}/10）
          </div>
          <div v-if="assessment.vet_remark" class="text-sm text-slate-500 mt-1">{{ assessment.vet_remark }}</div>
        </div>
        <textarea v-model="actionRemark" class="input-field min-h-[60px] resize-y" placeholder="审批备注（可选）" />
        <div class="flex gap-3">
          <button class="btn-primary" :disabled="acting" @click="handleApprove(true)">
            {{ acting ? '处理中...' : '审批通过' }}
          </button>
          <button class="btn-danger" :disabled="acting" @click="handleApprove(false)">
            {{ acting ? '处理中...' : '驳回' }}
          </button>
        </div>
      </div>

      <div v-else-if="responsibilityHint && !canAssess" class="card">
        <div class="flex items-center gap-3">
          <div class="flex-1">
            <div class="text-sm text-slate-400">{{ responsibilityHint.text }}</div>
            <div class="flex items-center gap-2 mt-1.5">
              <span class="text-xs text-slate-500">责任人:</span>
              <RoleBadge :role="responsibilityHint.role" />
            </div>
          </div>
          <div v-if="assessment.isOverdue" class="text-xs text-red-400 bg-red-500/10 px-2 py-1 rounded-lg">
            已超时
          </div>
        </div>
      </div>

      <div v-if="remarks.length" class="card">
        <h3 class="text-sm font-medium text-slate-300 mb-4">历史备注链</h3>
        <div class="space-y-3">
          <div
            v-for="(r, idx) in remarks"
            :key="idx"
            class="bg-slate-800/50 rounded-lg px-4 py-3"
          >
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xs text-slate-500 bg-slate-700 px-2 py-0.5 rounded">{{ r.phase }}</span>
              <span class="text-sm text-slate-300">{{ r.author }}</span>
              <RoleBadge :role="r.role" />
              <span class="text-xs text-slate-600 ml-auto">{{ r.time }}</span>
            </div>
            <div class="text-sm text-slate-400">{{ r.content }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-medium text-slate-300 mb-4">操作记录</h3>
        <Timeline :events="assessment.timeline || []" />
        <div v-if="!assessment.timeline?.length" class="text-sm text-slate-500 py-4 text-center">暂无操作记录</div>
      </div>
    </template>
  </div>
</template>
