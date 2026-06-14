<script setup lang="ts">
import { ArrowLeft, Send, XCircle, CheckCircle, FileText, History } from 'lucide-vue-next'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const caseStore = useCaseStore()

const caseId = computed(() => route.params.id as string)
const currentUser = computed(() => authStore.currentUser)

const showRejectModal = ref(false)
const showReviewFailModal = ref(false)
const rejectReason = ref('')
const reviewFailReason = ref('')

const currentCase = computed(() => caseStore.currentCase)
const materials = computed(() => caseStore.materials)
const logs = computed(() => caseStore.logs)

onMounted(async () => {
  if (!authStore.currentUser) {
    authStore.switchRole('CLAIM_AGENT')
  }
  await caseStore.fetchCase(caseId.value)
})

const canSubmit = computed(() => {
  if (!currentCase.value) return false
  return ['PENDING_SUBMIT', 'REJECTED', 'REVIEW_FAILED'].includes(currentCase.value.status)
})

const canApprove = computed(() => {
  if (!currentCase.value) return false
  return currentCase.value.status === 'SUBMITTED'
})

const canReject = computed(() => {
  if (!currentCase.value) return false
  return currentCase.value.status === 'SUBMITTED'
})

const allMaterialsConfirmed = computed(() => {
  return materials.value.length > 0 && materials.value.every(m => m.uploadStatus === 'CONFIRMED')
})

async function handleSubmit() {
  if (!authStore.currentUser) return
  try {
    await caseStore.submitCase(
      caseId.value,
      authStore.currentUser.id,
      authStore.currentUser.role
    )
    await caseStore.fetchCase(caseId.value)
  } catch (error) {
    alert('提交失败')
  }
}

async function handleReject() {
  if (!rejectReason.value || !authStore.currentUser) return
  try {
    await caseStore.rejectCase(
      caseId.value,
      authStore.currentUser.id,
      rejectReason.value
    )
    showRejectModal.value = false
    rejectReason.value = ''
    await caseStore.fetchCase(caseId.value)
  } catch (error) {
    alert('驳回失败')
  }
}

async function handleReviewFail() {
  if (!reviewFailReason.value || !authStore.currentUser) return
  try {
    await caseStore.reviewFailCase(
      caseId.value,
      authStore.currentUser.id,
      reviewFailReason.value
    )
    showReviewFailModal.value = false
    reviewFailReason.value = ''
    await caseStore.fetchCase(caseId.value)
  } catch (error) {
    alert('复核不通过处理失败')
  }
}

async function handleComplete() {
  if (!authStore.currentUser) return
  try {
    await caseStore.completeCase(
      caseId.value,
      authStore.currentUser.id
    )
    await caseStore.fetchCase(caseId.value)
  } catch (error) {
    alert('完成失败')
  }
}

function goToMaterials() {
  router.push(`/materials/${caseId.value}`)
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex flex-between flex-center">
        <div>
          <NuxtLink to="/cases" class="back-link">
            <ArrowLeft :size="16" />
            返回列表
          </NuxtLink>
          <h1 class="page-title mt-md">
            报案详情
            <CommonStatusBadge :status="currentCase?.status || 'PENDING_SUBMIT'" />
          </h1>
          <p class="page-subtitle" v-if="currentCase">
            报案编号：{{ currentCase.reportNo }}
          </p>
        </div>
      </div>
    </div>

    <div class="grid grid-2 gap-lg">
      <div class="left-column">
        <div class="card mb-lg">
          <h2 class="section-title mb-md">报案信息</h2>
          <div class="info-grid" v-if="currentCase">
            <div class="info-item">
              <span class="info-label">保单号</span>
              <span class="info-value">{{ currentCase.policyNo }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">被保险人</span>
              <span class="info-value">{{ currentCase.policyHolder }}</span>
            </div>
            <div class="info-item full-width">
              <span class="info-label">事故经过</span>
              <span class="info-value">{{ currentCase.accidentDesc }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">报案人</span>
              <span class="info-value">{{ currentCase.reporterId }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">创建时间</span>
              <span class="info-value">{{ new Date(currentCase.createdAt).toLocaleString('zh-CN') }}</span>
            </div>
          </div>
        </div>

        <div class="card mb-lg">
          <div class="flex flex-between flex-center mb-md">
            <h2 class="section-title">材料清单</h2>
            <button @click="goToMaterials" class="btn btn-secondary">
              <FileText :size="16" />
              管理材料
            </button>
          </div>
          
          <div v-if="materials.length === 0" class="empty-state">
            <p>暂无材料</p>
          </div>
          <div v-else class="materials-preview">
            <div 
              v-for="material in materials" 
              :key="material.id" 
              class="material-item"
            >
              <div class="material-info">
                <div class="material-name">{{ material.materialName }}</div>
                <div class="material-type">{{ material.materialType }}</div>
              </div>
              <CommonUploadStatusBadge :status="material.uploadStatus" />
            </div>
          </div>

          <div v-if="!allMaterialsConfirmed && currentCase?.status === 'SUBMITTED'" class="warning-box">
            <XCircle :size="16" />
            <span>所有材料必须确认后才能完成报案</span>
          </div>
        </div>

        <div class="actions-card card">
          <h2 class="section-title mb-md">操作</h2>
          <div class="action-buttons">
            <button 
              v-if="canSubmit && currentUser?.role === 'CLAIM_AGENT'"
              @click="handleSubmit"
              class="btn btn-primary"
              :disabled="caseStore.loading"
            >
              <Send :size="16" />
              提交报案
            </button>

            <button 
              v-if="canReject && currentUser?.role === 'SURVEYOR'"
              @click="showRejectModal = true"
              class="btn btn-danger"
            >
              <XCircle :size="16" />
              驳回
            </button>

            <button 
              v-if="canApprove && currentUser?.role === 'SURVEYOR' && allMaterialsConfirmed"
              @click="handleComplete"
              class="btn btn-success"
              :disabled="caseStore.loading"
            >
              <CheckCircle :size="16" />
              确认材料
            </button>

            <button 
              v-if="canApprove && currentUser?.role === 'UNDERWRITER'"
              @click="showReviewFailModal = true"
              class="btn btn-danger"
            >
              <XCircle :size="16" />
              复核不通过
            </button>

            <button 
              v-if="canApprove && currentUser?.role === 'UNDERWRITER' && allMaterialsConfirmed"
              @click="handleComplete"
              class="btn btn-success"
              :disabled="caseStore.loading"
            >
              <CheckCircle :size="16" />
              核赔通过
            </button>
          </div>
        </div>
      </div>

      <div class="right-column">
        <div class="card">
          <div class="flex flex-between flex-center mb-md">
            <h2 class="section-title">
              <History :size="18" />
              操作历史
            </h2>
          </div>
          
          <div v-if="logs.length === 0" class="empty-state">
            <p>暂无操作记录</p>
          </div>
          <div v-else class="timeline">
            <div v-for="log in logs" :key="log.id" class="timeline-item">
              <div class="timeline-dot"></div>
              <div class="timeline-content">
                <div class="timeline-time">
                  {{ new Date(log.createdAt).toLocaleString('zh-CN') }}
                </div>
                <div class="timeline-title">
                  {{ log.actionType === 'SUBMIT' ? '提交' : 
                     log.actionType === 'VERIFY' ? '审核' : 
                     log.actionType === 'REJECT' ? '驳回' : 
                     log.actionType === 'CONFIRM' ? '确认' : '补录' }}
                  <CommonRoleTag :role="log.operatorRole" />
                </div>
                <div v-if="log.remark" class="timeline-description">
                  {{ log.remark }}
                </div>
                <div v-if="log.beforeStatus && log.afterStatus" class="timeline-status">
                  {{ log.beforeStatus }} → {{ log.afterStatus }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showRejectModal" class="modal-overlay" @click.self="showRejectModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">驳回报案</h3>
        </div>
        <div class="form-group">
          <label class="form-label">驳回原因 *</label>
          <textarea 
            v-model="rejectReason"
            class="textarea"
            placeholder="请填写驳回原因"
            rows="4"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showRejectModal = false" class="btn btn-secondary">
            取消
          </button>
          <button @click="handleReject" class="btn btn-danger" :disabled="!rejectReason">
            确认驳回
          </button>
        </div>
      </div>
    </div>

    <div v-if="showReviewFailModal" class="modal-overlay" @click.self="showReviewFailModal = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">复核不通过</h3>
        </div>
        <div class="form-group">
          <label class="form-label">不通过原因 *</label>
          <textarea 
            v-model="reviewFailReason"
            class="textarea"
            placeholder="请填写复核不通过原因"
            rows="4"
          ></textarea>
        </div>
        <div class="modal-footer">
          <button @click="showReviewFailModal = false" class="btn btn-secondary">
            取消
          </button>
          <button @click="handleReviewFail" class="btn btn-danger" :disabled="!reviewFailReason">
            确认不通过
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  color: var(--color-text-secondary);
  text-decoration: none;
  font-size: 0.875rem;
}

.back-link:hover {
  color: var(--color-primary);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: var(--spacing-md);
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
}

.info-item.full-width {
  grid-column: 1 / -1;
}

.info-label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 0.875rem;
  color: var(--color-text);
  font-weight: 500;
}

.materials-preview {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.material-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.material-name {
  font-weight: 500;
  color: var(--color-text);
}

.material-type {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.warning-box {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-md);
  background: #fef3c7;
  color: #92400e;
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  margin-top: var(--spacing-md);
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.timeline-status {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-xs);
}
</style>
