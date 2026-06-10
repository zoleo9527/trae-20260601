<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useApi } from '@/composables/useApi'
import { useAuthStore } from '@/stores/auth'
import { ArrowLeft } from 'lucide-vue-next'
import StatusBadge from '@/components/StatusBadge.vue'
import StatusFlow from '@/components/StatusFlow.vue'
import Timeline from '@/components/Timeline.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const api = useApi()

const transferId = Number(route.params.id)
const transfer = ref<any>(null)
const loading = ref(true)
const actionRemark = ref('')
const acting = ref(false)
const errorMsg = ref('')

const canConfirmTransfer = computed(() => auth.role === '繁育员' && transfer.value?.status === 'pending_transfer')
const canSubmitAssessment = computed(() => auth.role === '繁育员' && transfer.value?.status === 'transferred')

async function fetchDetail() {
  loading.value = true
  try {
    const res = await api.getTransferDetail(transferId)
    transfer.value = res.data || res
  } catch {
    transfer.value = null
  } finally {
    loading.value = false
  }
}

async function handleAction(action: string) {
  acting.value = true
  errorMsg.value = ''
  try {
    await api.updateTransferStatus(transferId, action, actionRemark.value || undefined)
    actionRemark.value = ''
    await fetchDetail()
  } catch (e: any) {
    errorMsg.value = e.message || '操作失败'
  } finally {
    acting.value = false
  }
}

function goAssessment(id: number) {
  router.push(`/assessment/${id}`)
}

onMounted(fetchDetail)
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <div class="flex items-center gap-3">
      <button class="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors" @click="router.back()">
        <ArrowLeft :size="20" />
      </button>
      <h2 class="text-xl font-semibold text-slate-100">转栏详情</h2>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">加载中...</div>
    <div v-else-if="!transfer" class="text-center py-12 text-slate-500">记录不存在</div>
    <template v-else>
      <div class="card">
        <div class="flex items-center gap-3 mb-4">
          <span class="text-lg font-bold text-slate-100">{{ transfer.ear_tag }}</span>
          <StatusBadge :status="transfer.status" />
        </div>

        <StatusFlow
          :status="transfer.status"
          :next-action="transfer.nextAction || ''"
          :next-responsible="transfer.nextResponsible || ''"
          :is-overdue="transfer.isOverdue || false"
          :hours-left="transfer.hoursLeft"
        />
      </div>

      <div class="card">
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <div class="text-slate-500">品种</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.breed }}</div>
          </div>
          <div>
            <div class="text-slate-500">日龄</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.age_days }}天</div>
          </div>
          <div>
            <div class="text-slate-500">原栏位</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.from_pen }}</div>
          </div>
          <div>
            <div class="text-slate-500">目标栏位</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.to_pen }}</div>
          </div>
          <div>
            <div class="text-slate-500">转栏原因</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.reason }}</div>
          </div>
          <div>
            <div class="text-slate-500">创建人</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.operator }}</div>
          </div>
          <div v-if="transfer.confirmed_at">
            <div class="text-slate-500">确认时间</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.confirmed_at }}</div>
          </div>
          <div v-if="transfer.submitted_at">
            <div class="text-slate-500">提交评估时间</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.submitted_at }}</div>
          </div>
        </div>
        <div v-if="transfer.remark" class="mt-4 pt-4 border-t border-slate-700">
          <div class="text-slate-500 text-sm">备注</div>
          <div class="text-slate-300 text-sm mt-1">{{ transfer.remark }}</div>
        </div>
      </div>

      <div v-if="transfer.assessment && (transfer.status === 'pending_assessment' || transfer.status === 'pending_approval' || transfer.status === 'culled' || transfer.status === 'retained')" class="card">
        <div class="flex items-center justify-between mb-3">
          <h3 class="text-sm font-medium text-slate-300">关联评估</h3>
          <button
            class="text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
            @click="goAssessment(transfer.assessment.id)"
          >
            查看评估详情 →
          </button>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
          <div v-if="transfer.assessment.health_score != null">
            <div class="text-slate-500">健康评分</div>
            <div class="text-slate-200 mt-0.5 font-semibold">{{ transfer.assessment.health_score }} / 10</div>
          </div>
          <div v-if="transfer.assessment.vet_name">
            <div class="text-slate-500">评估兽医</div>
            <div class="text-slate-200 mt-0.5">{{ transfer.assessment.vet_name }}</div>
          </div>
          <div v-if="transfer.assessment.cull_recommend != null && transfer.assessment.assessed_at">
            <div class="text-slate-500">淘汰建议</div>
            <div class="mt-0.5">
              <span v-if="transfer.assessment.cull_recommend" class="text-red-400 text-sm">建议淘汰</span>
              <span v-else class="text-emerald-400 text-sm">建议留养</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="text-sm font-medium text-slate-300 mb-4">操作记录</h3>
        <Timeline :events="transfer.timeline || []" />
        <div v-if="!transfer.timeline?.length" class="text-sm text-slate-500 py-4 text-center">暂无操作记录</div>
      </div>

      <div v-if="canConfirmTransfer || canSubmitAssessment" class="card space-y-4">
        <h3 class="text-sm font-medium text-slate-300">操作</h3>
        <div v-if="errorMsg" class="text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          {{ errorMsg }}
        </div>
        <div v-if="canConfirmTransfer" class="text-xs text-amber-400 bg-amber-500/10 rounded-lg px-3 py-2">
          当前待您确认转栏{{ transfer.isOverdue ? '（已超时）' : '' }}
        </div>
        <div v-if="canSubmitAssessment" class="text-xs text-blue-400 bg-blue-500/10 rounded-lg px-3 py-2">
          转栏已确认，请提交评估申请供兽医评估
        </div>
        <textarea
          v-model="actionRemark"
          class="input-field min-h-[60px] resize-y"
          placeholder="备注（可选）"
        />
        <div class="flex gap-3">
          <button
            v-if="canConfirmTransfer"
            class="btn-primary"
            :disabled="acting"
            @click="handleAction('confirm')"
          >
            {{ acting ? '处理中...' : '确认转栏' }}
          </button>
          <button
            v-if="canSubmitAssessment"
            class="btn-primary"
            :disabled="acting"
            @click="handleAction('submit')"
          >
            {{ acting ? '处理中...' : '提交评估' }}
          </button>
        </div>
      </div>
    </template>
  </div>
</template>
