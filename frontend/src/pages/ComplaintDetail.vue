<template>
  <div class="complaint-detail" v-if="complaint">
    <div class="detail-header">
      <div class="header-left">
        <button class="back-btn" @click="goBack">
          ← 返回列表
        </button>
        <div class="title-block">
          <div class="title-row">
            <h2 class="detail-title">客诉单详情</h2>
            <span
              class="status-tag-large"
              :style="{
                color: STATUS_CONFIG[complaint.status].color,
                background: STATUS_CONFIG[complaint.status].bgColor
              }"
            >
              {{ STATUS_CONFIG[complaint.status].label }}
            </span>
          </div>
          <div class="no-row">
            <span class="complaint-no">{{ complaint.complaintNo }}</span>
            <span v-if="complaint.returnCount > 0" class="meta-pill pill-red">
              被退回 {{ complaint.returnCount }} 次
            </span>
            <span v-if="complaint.recheckCount > 0" class="meta-pill pill-yellow">
              复核 {{ complaint.recheckCount }} 次
            </span>
          </div>
        </div>
      </div>
    </div>

    <div class="process-flow-card">
      <div class="flow-title">主流程 · 处理流转</div>
      <div class="flow-steps">
        <div
          v-for="(step, idx) in flowSteps"
          :key="step.key"
          class="flow-step"
          :class="{
            active: currentFlowStepIdx === idx,
            done: currentFlowStepIdx > idx
          }"
        >
          <div class="step-dot">
            <span v-if="currentFlowStepIdx > idx" class="dot-check">✓</span>
            <span v-else>{{ idx + 1 }}</span>
          </div>
          <div class="step-label">{{ step.label }}</div>
          <div class="step-role">{{ step.role }}</div>
          <div v-if="idx < flowSteps.length - 1" class="step-line"></div>
        </div>
      </div>
    </div>

    <div class="detail-grid">
      <div class="main-col">
        <div class="info-card">
          <div class="card-title">基本信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">客诉类型</span>
              <span class="type-tag">{{ COMPLAINT_TYPE_CONFIG[complaint.type] }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">品牌</span>
              <span class="info-value strong">{{ complaint.brand }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">专柜</span>
              <span class="info-value">{{ complaint.counter }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">楼层</span>
              <span class="info-value">{{ complaint.floor }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">商品名称</span>
              <span class="info-value">{{ complaint.productName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">商品价格</span>
              <span class="info-value price">¥{{ complaint.productPrice.toLocaleString() }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">购买日期</span>
              <span class="info-value">{{ complaint.purchaseDate }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">投诉日期</span>
              <span class="info-value">{{ complaint.complaintDate }}</span>
            </div>
            <div v-if="complaint.refundAmount" class="info-item">
              <span class="info-label">退款金额</span>
              <span class="info-value price">¥{{ complaint.refundAmount.toLocaleString() }}</span>
            </div>
            <div v-if="complaint.exchangeProduct" class="info-item">
              <span class="info-label">换货商品</span>
              <span class="info-value">{{ complaint.exchangeProduct }}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="card-title">顾客信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">姓名</span>
              <span class="info-value strong">{{ complaint.customerName }}</span>
            </div>
            <div class="info-item">
              <span class="info-label">联系电话</span>
              <span class="info-value">{{ complaint.customerPhone }}</span>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="card-title">客诉详情</div>
          <div class="complaint-content">{{ complaint.complaintContent }}</div>
        </div>

        <div v-if="complaint.brandFeedbackList.length > 0" class="info-card">
          <div class="card-title">
            品牌反馈
            <span class="count-badge">{{ complaint.brandFeedbackList.length }}</span>
          </div>
          <div class="feedback-list">
            <div
              v-for="(fb, idx) in complaint.brandFeedbackList"
              :key="fb.id"
              class="feedback-item"
            >
              <div class="feedback-head">
                <div class="fb-operator">
                  <span class="fb-avatar">品</span>
                  <div>
                    <div class="fb-name">{{ fb.operator }}</div>
                    <div class="fb-time">{{ formatDateTime(fb.timestamp) }}</div>
                  </div>
                </div>
                <span
                  class="resp-tag"
                  :class="fb.responsibility"
                >
                  {{ RESPONSIBILITY_CONFIG[fb.responsibility] }}
                </span>
              </div>
              <div class="fb-content-block">
                <div class="fb-label">反馈内容：</div>
                <div class="fb-text">{{ fb.feedbackContent }}</div>
              </div>
              <div class="fb-content-block">
                <div class="fb-label">处理建议：</div>
                <div class="fb-text suggestion">{{ fb.handlingSuggestion }}</div>
              </div>
              <div v-if="fb.attachments && fb.attachments.length > 0" class="fb-attachments">
                <span class="fb-label">附件：</span>
                <span v-for="att in fb.attachments" :key="att" class="attachment-chip">
                  📎 {{ att }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="info-card">
          <div class="card-title">
            操作日志 · 全链路留痕
            <span class="count-badge">{{ complaint.operations.length }}</span>
          </div>
          <div class="timeline">
            <div
              v-for="(op, idx) in sortedOperations"
              :key="op.id"
              class="timeline-item"
            >
              <div class="timeline-left">
                <div
                  class="timeline-dot"
                  :class="op.role"
                  :style="{ opacity: idx === 0 ? 1 : 0.7 }"
                ></div>
                <div v-if="idx < sortedOperations.length - 1" class="timeline-line"></div>
              </div>
              <div class="timeline-content">
                <div class="timeline-head">
                  <span class="op-action">{{ op.action }}</span>
                  <span class="op-role" :class="op.role">{{ roleLabel(op.role) }}</span>
                  <span class="op-operator">{{ op.operator }}</span>
                  <span class="op-time">{{ formatDateTime(op.timestamp) }}</span>
                </div>
                <div class="timeline-remark">{{ op.remark }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="side-col">
        <div class="info-card sticky">
          <div class="card-title">处理中心</div>

          <div class="handler-info">
            <div class="handler-label">当前处理人</div>
            <div class="handler-block">
              <span class="handler-avatar" :class="complaint.currentHandlerRole">
                {{ complaint.currentHandler.charAt(0) }}
              </span>
              <div>
                <div class="handler-name">{{ complaint.currentHandler }}</div>
                <div class="handler-role-text">{{ roleLabel(complaint.currentHandlerRole) }}</div>
              </div>
            </div>
          </div>

          <div class="divider"></div>

          <div v-if="canAct" class="action-section">
            <div class="section-label">我可以执行的操作</div>

            <template v-if="roleStore.currentRole.key === 'manager'">
              <template v-if="complaint.status === 'returned_to_manager'">
                <div class="form-group">
                  <label class="form-label">补录说明 <span class="required">*</span></label>
                  <textarea
                    v-model="actionForm.remark"
                    class="form-textarea"
                    rows="3"
                    placeholder="请补充被退回要求的材料或说明，例如：已补充包装盒照片、会员消费记录截图..."
                  ></textarea>
                </div>
                <button class="btn btn-primary btn-block" @click="handleResubmit">
                  补录后重新提交 →
                </button>
                <div class="tip-text">将提交至{{ complaintStore.roleLabel('supervisor') }}（{{ complaintStore.roleUser('supervisor') }}）复核</div>
              </template>

              <template v-if="complaint.status === 'rechecked'">
                <div class="form-group">
                  <label class="form-label">结案说明 <span class="required">*</span></label>
                  <textarea
                    v-model="actionForm.remark"
                    class="form-textarea"
                    rows="3"
                    placeholder="请描述最终处理结果，顾客是否满意..."
                  ></textarea>
                </div>
                <button class="btn btn-success btn-block" @click="handleComplete">
                  ✓ 确认处理完成
                </button>
              </template>
            </template>

            <template v-if="roleStore.currentRole.key === 'supervisor'">
              <template v-if="complaint.status === 'pending_supervisor' || complaint.status === 'resubmitted'">
                <div class="form-group">
                  <label class="form-label">审核意见</label>
                  <textarea
                    v-model="actionForm.remark"
                    class="form-textarea"
                    rows="2"
                    placeholder="（可选）填写审核说明"
                  ></textarea>
                </div>
                <button class="btn btn-primary btn-block" @click="handlePassToBrand">
                  审核通过 → 转交品牌督导
                </button>
                <button class="btn btn-danger btn-block btn-outline" @click="showReturnToManager = true">
                  ✗ 退回柜长补录
                </button>
              </template>

              <template v-if="complaint.status === 'returned_to_supervisor'">
                <div class="form-group">
                  <label class="form-label">复核意见 <span class="required">*</span></label>
                  <textarea
                    v-model="actionForm.remark"
                    class="form-textarea"
                    rows="3"
                    placeholder="请复核品牌反馈，给出最终处理意见..."
                  ></textarea>
                </div>
                <button class="btn btn-success btn-block" @click="handleRecheckPass">
                  ✓ 复核通过 → 转回柜长执行
                </button>
                <button class="btn btn-danger btn-block btn-outline" @click="showReturnToBrand = true">
                  ✗ 退回品牌督导补充
                </button>
              </template>

              <template v-if="complaint.status === 'brand_feedback'">
                <div class="form-group">
                  <label class="form-label">复核意见 <span class="required">*</span></label>
                  <textarea
                    v-model="actionForm.remark"
                    class="form-textarea"
                    rows="3"
                    placeholder="请复核品牌反馈内容和处理建议..."
                  ></textarea>
                </div>
                <button class="btn btn-success btn-block" @click="handleRecheckPass">
                  ✓ 复核通过 → 转回柜长执行
                </button>
                <button class="btn btn-warning btn-block btn-outline" @click="showReturnToBrand = true">
                  ⚠ 退回品牌督导补充反馈
                </button>
              </template>
            </template>

            <template v-if="roleStore.currentRole.key === 'superintendent'">
              <template v-if="complaint.status === 'pending_brand'">
                <div class="form-group">
                  <label class="form-label">品牌反馈内容 <span class="required">*</span></label>
                  <textarea
                    v-model="actionForm.feedbackContent"
                    class="form-textarea"
                    rows="3"
                    placeholder="请填写品牌方的调查结论、质量检测结果等..."
                  ></textarea>
                </div>
                <div class="form-group">
                  <label class="form-label">责任界定 <span class="required">*</span></label>
                  <select v-model="actionForm.responsibility" class="form-select">
                    <option value="">请选择责任方</option>
                    <option v-for="(label, key) in RESPONSIBILITY_CONFIG" :key="key" :value="key">
                      {{ label }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">品牌处理建议 <span class="required">*</span></label>
                  <textarea
                    v-model="actionForm.handlingSuggestion"
                    class="form-textarea"
                    rows="3"
                    placeholder="请填写品牌方给出的具体处理方案，如退款金额、换货安排、补偿措施等..."
                  ></textarea>
                </div>
                <button class="btn btn-primary btn-block" @click="handleSubmitBrandFeedback">
                  提交品牌反馈 → 返回楼层主管复核
                </button>
              </template>
            </template>
          </div>

          <div v-else class="cant-act">
            <div class="cant-icon">🔒</div>
            <div class="cant-text">当前不是您的处理环节</div>
            <div class="cant-desc">
              请切换到 <strong>{{ roleLabel(complaint.currentHandlerRole) }}</strong>（{{ complaint.currentHandler }}）角色进行操作
            </div>
          </div>

          <div class="divider"></div>

          <div class="quick-roles">
            <div class="section-label">快速切换角色</div>
            <div class="role-buttons">
              <button
                v-for="r in ROLES"
                :key="r.key"
                class="role-quick-btn"
                :class="[r.key, { active: roleStore.currentRole.key === r.key }]"
                @click="roleStore.setRole(r.key)"
              >
                {{ r.label }}
                <span class="role-user">{{ r.user }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReturnToManager" class="modal-overlay" @click.self="showReturnToManager = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">退回柜长补录</h3>
          <button class="modal-close" @click="showReturnToManager = false">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            ⚠ 退回后，柜长需要补充材料后重新提交。请明确说明退回原因。
          </div>
          <div class="form-group">
            <label class="form-label required">退回原因 <span class="required">*</span></label>
            <textarea
              v-model="actionForm.returnReason"
              class="form-textarea"
              rows="4"
              placeholder="请详细说明需要柜长补充哪些材料或信息..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showReturnToManager = false">取消</button>
          <button class="btn btn-danger" @click="handleReturnToManager">确认退回</button>
        </div>
      </div>
    </div>

    <div v-if="showReturnToBrand" class="modal-overlay" @click.self="showReturnToBrand = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">退回品牌督导补充</h3>
          <button class="modal-close" @click="showReturnToBrand = false">×</button>
        </div>
        <div class="modal-body">
          <div class="alert alert-warning">
            ⚠ 退回后，品牌督导需要补充完善反馈后再次提交。
          </div>
          <div class="form-group">
            <label class="form-label required">退回原因 <span class="required">*</span></label>
            <textarea
              v-model="actionForm.returnReason"
              class="form-textarea"
              rows="4"
              placeholder="请详细说明需要品牌方补充哪些信息..."
            ></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showReturnToBrand = false">取消</button>
          <button class="btn btn-warning" @click="handleReturnToBrand">确认退回</button>
        </div>
      </div>
    </div>

    <div v-if="showSuccessToast" class="success-toast">
      ✓ {{ toastMessage }}
    </div>
  </div>

  <div v-else class="not-found">
    <div class="nf-icon">😕</div>
    <div class="nf-title">未找到该客诉单</div>
    <button class="btn btn-primary" @click="goBack">返回列表</button>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useComplaintStore } from '@/stores/complaint'
import { useRoleStore } from '@/stores/role'
import {
  STATUS_CONFIG,
  COMPLAINT_TYPE_CONFIG,
  RESPONSIBILITY_CONFIG,
  ROLES,
  type ComplaintStatus,
  type RoleKey,
  type ResponsibilityParty,
  type Complaint
} from '@/types'

const props = defineProps<{ id: string }>()

const router = useRouter()
const route = useRoute()
const complaintStore = useComplaintStore()
const roleStore = useRoleStore()

const showReturnToManager = ref(false)
const showReturnToBrand = ref(false)
const showSuccessToast = ref(false)
const toastMessage = ref('')

const actionForm = reactive({
  remark: '',
  returnReason: '',
  feedbackContent: '',
  responsibility: '' as ResponsibilityParty | '',
  handlingSuggestion: ''
})

const complaint = computed<Complaint | undefined>(() => {
  return complaintStore.getById(props.id || route.params.id as string)
})

const flowSteps = [
  { key: 'submit', label: '提交客诉', role: '柜长' },
  { key: 'review', label: '楼层审核', role: '楼层主管' },
  { key: 'brand', label: '品牌反馈', role: '品牌督导' },
  { key: 'recheck', label: '复核确认', role: '楼层主管' },
  { key: 'complete', label: '处理完成', role: '柜长' }
]

const statusToStep: Record<ComplaintStatus, number> = {
  draft: 0,
  pending_supervisor: 1,
  returned_to_manager: 0,
  resubmitted: 1,
  pending_brand: 2,
  brand_feedback: 3,
  returned_to_supervisor: 3,
  rechecked: 4,
  completed: 5,
  cancelled: 5
}

const currentFlowStepIdx = computed(() => {
  if (!complaint.value) return 0
  return Math.min(statusToStep[complaint.value.status] || 0, flowSteps.length)
})

const canAct = computed(() => {
  if (!complaint.value) return false
  return complaint.value.currentHandlerRole === roleStore.currentRole.key
    && !['completed', 'cancelled'].includes(complaint.value.status)
})

const sortedOperations = computed(() => {
  if (!complaint.value) return []
  return [...complaint.value.operations].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )
})

function roleLabel(key: RoleKey) {
  return ROLES.find(r => r.key === key)?.label || key
}

function formatDateTime(iso: string) {
  const d = new Date(iso)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const h = String(d.getHours()).padStart(2, '0')
  const min = String(d.getMinutes()).padStart(2, '0')
  return `${y}-${m}-${day} ${h}:${min}`
}

function goBack() {
  router.push('/')
}

function showToast(msg: string) {
  toastMessage.value = msg
  showSuccessToast.value = true
  setTimeout(() => {
    showSuccessToast.value = false
  }, 2500)
}

function resetForm() {
  actionForm.remark = ''
  actionForm.returnReason = ''
  actionForm.feedbackContent = ''
  actionForm.responsibility = ''
  actionForm.handlingSuggestion = ''
}

function handleResubmit() {
  if (!actionForm.remark) {
    alert('请填写补录说明')
    return
  }
  if (!complaint.value) return

  const id = complaint.value.id
  const now = new Date().toISOString()

  complaintStore.addOperation(id, {
    timestamp: now,
    operator: roleStore.currentUser.value,
    role: roleStore.currentRole.key,
    action: '补录后重新提交',
    remark: actionForm.remark
  })

  complaintStore.updateStatus(id, 'resubmitted', 'supervisor')
  showToast('已补录并重新提交')
  resetForm()
}

function handlePassToBrand() {
  if (!complaint.value) return
  const id = complaint.value.id
  const now = new Date().toISOString()

  complaintStore.addOperation(id, {
    timestamp: now,
    operator: roleStore.currentUser.value,
    role: roleStore.currentRole.key,
    action: '审核通过，转交品牌督导',
    remark: actionForm.remark || '资料齐全，同意转交品牌方处理。'
  })

  complaintStore.updateStatus(id, 'pending_brand', 'superintendent')
  showToast('已转交品牌督导')
  resetForm()
}

function handleReturnToManager() {
  if (!actionForm.returnReason) {
    alert('请填写退回原因')
    return
  }
  if (!complaint.value) return

  const id = complaint.value.id
  const now = new Date().toISOString()

  complaintStore.addOperation(id, {
    timestamp: now,
    operator: roleStore.currentUser.value,
    role: roleStore.currentRole.key,
    action: '退回柜长补录',
    remark: actionForm.returnReason
  })

  complaintStore.incrementReturnCount(id)
  complaintStore.updateStatus(id, 'returned_to_manager', 'manager')
  showReturnToManager.value = false
  showToast('已退回柜长补录')
  resetForm()
}

function handleSubmitBrandFeedback() {
  if (!actionForm.feedbackContent) {
    alert('请填写品牌反馈内容')
    return
  }
  if (!actionForm.responsibility) {
    alert('请选择责任界定')
    return
  }
  if (!actionForm.handlingSuggestion) {
    alert('请填写品牌处理建议')
    return
  }
  if (!complaint.value) return

  const id = complaint.value.id
  const now = new Date().toISOString()

  complaintStore.addBrandFeedback(id, {
    timestamp: now,
    operator: `${complaint.value.brand}品牌-${roleStore.currentUser.value}`,
    feedbackContent: actionForm.feedbackContent,
    responsibility: actionForm.responsibility as ResponsibilityParty,
    handlingSuggestion: actionForm.handlingSuggestion
  })

  complaintStore.addOperation(id, {
    timestamp: now,
    operator: roleStore.currentUser.value,
    role: roleStore.currentRole.key,
    action: '提交品牌反馈',
    remark: `责任界定：${RESPONSIBILITY_CONFIG[actionForm.responsibility as ResponsibilityParty]}；处理建议：${actionForm.handlingSuggestion.slice(0, 100)}...`
  })

  complaintStore.updateStatus(id, 'brand_feedback', 'supervisor')
  showToast('品牌反馈已提交')
  resetForm()
}

function handleReturnToBrand() {
  if (!actionForm.returnReason) {
    alert('请填写退回原因')
    return
  }
  if (!complaint.value) return

  const id = complaint.value.id
  const now = new Date().toISOString()

  complaintStore.addOperation(id, {
    timestamp: now,
    operator: roleStore.currentUser.value,
    role: roleStore.currentRole.key,
    action: '退回品牌督导补充',
    remark: actionForm.returnReason
  })

  complaintStore.incrementReturnCount(id)
  complaintStore.updateStatus(id, 'pending_brand', 'superintendent')
  showReturnToBrand.value = false
  showToast('已退回品牌督导')
  resetForm()
}

function handleRecheckPass() {
  if (!actionForm.remark) {
    alert('请填写复核意见')
    return
  }
  if (!complaint.value) return

  const id = complaint.value.id
  const now = new Date().toISOString()

  complaintStore.addOperation(id, {
    timestamp: now,
    operator: roleStore.currentUser.value,
    role: roleStore.currentRole.key,
    action: '复核通过',
    remark: actionForm.remark
  })

  complaintStore.incrementRecheckCount(id)
  complaintStore.updateStatus(id, 'rechecked', 'manager')
  showToast('复核通过，已转回柜长执行')
  resetForm()
}

function handleComplete() {
  if (!actionForm.remark) {
    alert('请填写结案说明')
    return
  }
  if (!complaint.value) return

  const id = complaint.value.id
  const now = new Date().toISOString()

  complaintStore.addOperation(id, {
    timestamp: now,
    operator: roleStore.currentUser.value,
    role: roleStore.currentRole.key,
    action: '处理完成',
    remark: actionForm.remark
  })

  complaintStore.updateStatus(id, 'completed', 'manager')
  showToast('客诉单已完成处理 🎉')
  resetForm()
}
</script>

<style scoped>
.complaint-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-header {
  background: white;
  padding: 20px 24px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.back-btn {
  background: #f7fafc;
  color: #4a5568;
  padding: 8px 14px;
  border-radius: 6px;
  font-size: 14px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: #edf2f7;
}

.title-block {
  flex: 1;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.detail-title {
  font-size: 20px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.status-tag-large {
  padding: 5px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
}

.no-row {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 10px;
}

.complaint-no {
  font-family: 'SF Mono', Consolas, monospace;
  color: #718096;
  font-size: 14px;
}

.meta-pill {
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 500;
}

.pill-red {
  background: #fed7d7;
  color: #c53030;
}

.pill-yellow {
  background: #fefcbf;
  color: #975a16;
}

.process-flow-card {
  background: white;
  padding: 24px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.flow-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 20px;
}

.flow-steps {
  display: flex;
  justify-content: space-between;
  position: relative;
  padding: 0 20px;
}

.flow-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
  z-index: 1;
  flex: 1;
}

.step-dot {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #a0aec0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
  transition: all 0.3s;
  border: 2px solid white;
}

.flow-step.active .step-dot {
  background: #2c5282;
  color: white;
  box-shadow: 0 0 0 4px rgba(44, 82, 130, 0.15);
}

.flow-step.done .step-dot {
  background: #38a169;
  color: white;
}

.dot-check {
  font-size: 16px;
}

.step-label {
  margin-top: 10px;
  font-size: 13px;
  font-weight: 600;
  color: #a0aec0;
}

.flow-step.active .step-label {
  color: #2c5282;
}

.flow-step.done .step-label {
  color: #38a169;
}

.step-role {
  margin-top: 2px;
  font-size: 12px;
  color: #a0aec0;
}

.flow-step.active .step-role,
.flow-step.done .step-role {
  color: #718096;
}

.step-line {
  position: absolute;
  top: 19px;
  left: 60%;
  width: 80%;
  height: 2px;
  background: #e2e8f0;
  z-index: 0;
}

.flow-step.done .step-line {
  background: #38a169;
}

.detail-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
}

.main-col {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.side-col {
  position: relative;
}

.info-card {
  background: white;
  padding: 20px 24px;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
}

.info-card.sticky {
  position: sticky;
  top: 88px;
}

.card-title {
  font-size: 15px;
  font-weight: 600;
  color: #1a202c;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #f0f4f8;
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  background: #edf2f7;
  color: #718096;
  font-size: 12px;
  padding: 1px 8px;
  border-radius: 10px;
  font-weight: 500;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #a0aec0;
}

.info-value {
  font-size: 14px;
  color: #2d3748;
}

.info-value.strong {
  font-weight: 600;
}

.info-value.price {
  color: #e53e3e;
  font-weight: 600;
}

.type-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  background: #ebf8ff;
  color: #2b6cb0;
  font-size: 12px;
  font-weight: 500;
  align-self: flex-start;
}

.complaint-content {
  background: #f7fafc;
  padding: 14px 16px;
  border-radius: 8px;
  color: #2d3748;
  line-height: 1.7;
  font-size: 14px;
}

.feedback-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feedback-item {
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  padding: 16px;
}

.feedback-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.fb-operator {
  display: flex;
  gap: 10px;
  align-items: center;
}

.fb-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.fb-name {
  font-weight: 600;
  color: #276749;
  font-size: 14px;
}

.fb-time {
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
}

.resp-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.resp-tag.brand {
  background: #bee3f8;
  color: #2b6cb0;
}

.resp-tag.store {
  background: #fefcbf;
  color: #975a16;
}

.resp-tag.customer {
  background: #fed7d7;
  color: #c53030;
}

.resp-tag.unclear {
  background: #e2e8f0;
  color: #4a5568;
}

.fb-content-block {
  margin-bottom: 10px;
}

.fb-label {
  font-size: 12px;
  color: #68d391;
  font-weight: 500;
  margin-bottom: 4px;
}

.fb-text {
  color: #2d3748;
  font-size: 14px;
  line-height: 1.6;
}

.fb-text.suggestion {
  background: white;
  padding: 10px 12px;
  border-radius: 6px;
  border-left: 3px solid #68d391;
}

.fb-attachments {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.attachment-chip {
  background: white;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  color: #4a5568;
  border: 1px solid #c6f6d5;
}

.timeline {
  display: flex;
  flex-direction: column;
}

.timeline-item {
  display: flex;
  gap: 14px;
}

.timeline-left {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 24px;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 4px;
}

.timeline-dot.manager {
  background: #f6ad55;
}

.timeline-dot.supervisor {
  background: #4299e1;
}

.timeline-dot.superintendent {
  background: #48bb78;
}

.timeline-line {
  width: 2px;
  flex: 1;
  background: #e2e8f0;
  margin: 4px 0;
  min-height: 20px;
}

.timeline-content {
  flex: 1;
  padding-bottom: 18px;
}

.timeline-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
  flex-wrap: wrap;
}

.op-action {
  font-weight: 600;
  color: #1a202c;
  font-size: 14px;
}

.op-role {
  font-size: 11px;
  padding: 1px 7px;
  border-radius: 3px;
  font-weight: 500;
}

.op-role.manager {
  background: #fef5e7;
  color: #9c4221;
}

.op-role.supervisor {
  background: #ebf8ff;
  color: #2b6cb0;
}

.op-role.superintendent {
  background: #f0fff4;
  color: #276749;
}

.op-operator {
  font-size: 13px;
  color: #4a5568;
}

.op-time {
  font-size: 12px;
  color: #a0aec0;
  margin-left: auto;
}

.timeline-remark {
  color: #4a5568;
  font-size: 13px;
  line-height: 1.6;
  padding: 8px 12px;
  background: #f7fafc;
  border-radius: 6px;
}

.handler-info {
  margin-bottom: 4px;
}

.handler-label {
  font-size: 12px;
  color: #a0aec0;
  margin-bottom: 10px;
}

.handler-block {
  display: flex;
  align-items: center;
  gap: 12px;
}

.handler-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: white;
}

.handler-avatar.manager {
  background: linear-gradient(135deg, #f6ad55, #ed8936);
}

.handler-avatar.supervisor {
  background: linear-gradient(135deg, #63b3ed, #4299e1);
}

.handler-avatar.superintendent {
  background: linear-gradient(135deg, #68d391, #48bb78);
}

.handler-name {
  font-weight: 600;
  color: #1a202c;
  font-size: 15px;
}

.handler-role-text {
  font-size: 12px;
  color: #718096;
  margin-top: 2px;
}

.divider {
  height: 1px;
  background: #edf2f7;
  margin: 18px 0;
}

.section-label {
  font-size: 13px;
  font-weight: 600;
  color: #4a5568;
  margin-bottom: 12px;
}

.form-group {
  margin-bottom: 14px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #4a5568;
  margin-bottom: 6px;
}

.required {
  color: #e53e3e;
}

.form-textarea, .form-select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  font-size: 14px;
  color: #2d3748;
  background: white;
  transition: all 0.2s;
  font-family: inherit;
}

.form-textarea:focus, .form-select:focus {
  outline: none;
  border-color: #2c5282;
  box-shadow: 0 0 0 3px rgba(44, 82, 130, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 70px;
  line-height: 1.5;
}

.btn {
  padding: 10px 16px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-block {
  width: 100%;
  margin-top: 4px;
}

.btn-primary {
  background: #2c5282;
  color: white;
}

.btn-primary:hover {
  background: #1e3a5f;
}

.btn-success {
  background: #38a169;
  color: white;
}

.btn-success:hover {
  background: #276749;
}

.btn-danger {
  background: #e53e3e;
  color: white;
}

.btn-danger:hover {
  background: #c53030;
}

.btn-warning {
  background: #d69e2e;
  color: white;
}

.btn-warning:hover {
  background: #b7791f;
}

.btn-danger.btn-outline {
  background: white;
  color: #e53e3e;
  border: 1px solid #fed7d7;
  margin-top: 10px;
}

.btn-danger.btn-outline:hover {
  background: #fff5f5;
}

.btn-warning.btn-outline {
  background: white;
  color: #d69e2e;
  border: 1px solid #fefcbf;
  margin-top: 10px;
}

.btn-warning.btn-outline:hover {
  background: #fffff0;
}

.btn-outline {
  background: white;
  color: #4a5568;
  border: 1px solid #cbd5e0;
}

.tip-text {
  margin-top: 8px;
  font-size: 12px;
  color: #a0aec0;
  text-align: center;
}

.cant-act {
  text-align: center;
  padding: 24px 16px;
}

.cant-icon {
  font-size: 40px;
  margin-bottom: 12px;
  opacity: 0.7;
}

.cant-text {
  font-size: 15px;
  font-weight: 600;
  color: #718096;
  margin-bottom: 6px;
}

.cant-desc {
  font-size: 13px;
  color: #a0aec0;
  line-height: 1.6;
}

.role-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.role-quick-btn {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s;
  text-align: left;
}

.role-quick-btn.manager {
  background: #fef5e7;
  color: #9c4221;
  border: 1px solid transparent;
}

.role-quick-btn.supervisor {
  background: #ebf8ff;
  color: #2b6cb0;
  border: 1px solid transparent;
}

.role-quick-btn.superintendent {
  background: #f0fff4;
  color: #276749;
  border: 1px solid transparent;
}

.role-quick-btn.active.manager {
  border-color: #f6ad55;
  box-shadow: 0 0 0 2px rgba(246, 173, 85, 0.2);
}

.role-quick-btn.active.supervisor {
  border-color: #63b3ed;
  box-shadow: 0 0 0 2px rgba(99, 179, 237, 0.2);
}

.role-quick-btn.active.superintendent {
  border-color: #68d391;
  box-shadow: 0 0 0 2px rgba(104, 211, 145, 0.2);
}

.role-user {
  font-size: 11px;
  opacity: 0.7;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 17px;
  font-weight: 600;
  color: #1a202c;
  margin: 0;
}

.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  background: #f7fafc;
  font-size: 20px;
  color: #718096;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  padding: 16px 24px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.alert {
  padding: 12px 14px;
  border-radius: 6px;
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.5;
}

.alert-warning {
  background: #fffff0;
  color: #975a16;
  border: 1px solid #fefcbf;
}

.not-found {
  text-align: center;
  padding: 100px 40px;
}

.nf-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.nf-title {
  font-size: 18px;
  color: #718096;
  margin-bottom: 20px;
}

.success-toast {
  position: fixed;
  top: 88px;
  left: 50%;
  transform: translateX(-50%);
  background: #2f855a;
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  z-index: 2000;
  box-shadow: 0 4px 12px rgba(47, 133, 90, 0.3);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

@media (max-width: 1100px) {
  .detail-grid {
    grid-template-columns: 1fr;
  }
  .info-card.sticky {
    position: static;
  }
}

@media (max-width: 768px) {
  .flow-steps {
    overflow-x: auto;
    padding-bottom: 10px;
  }
  .flow-step {
    min-width: 100px;
  }
  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
