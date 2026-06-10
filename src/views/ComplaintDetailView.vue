<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { complaintApi, logsApi } from '../api/resources'
import { STATUS_LABELS, ROLE_LABELS } from '../types'
import { useAuthStore } from '../stores/auth'
import type { Complaint, ProcessingLog } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const complaint = ref<Complaint | null>(null)
const logs = ref<ProcessingLog[]>([])
const loading = ref(true)
const handling = ref(false)
const replying = ref(false)
const replyContent = ref('')
const showReplyDialog = ref(false)
const relatedReservation = ref<any>(null)

const complaintSteps = computed(() => {
  if (!complaint.value) return []
  return [
    { key: 'pending', label: '游客投诉', done: true },
    { key: 'processing', label: '受理中', done: ['processing', 'replied'].includes(complaint.value.status) },
    { key: 'replied', label: '已回复', done: complaint.value.status === 'replied' },
  ]
})

const nextAction = computed(() => {
  if (!complaint.value) return null
  if (complaint.value.status === 'pending') {
    return { text: '立即受理，避免游客长时间等待', type: 'danger' }
  }
  if (complaint.value.status === 'processing') {
    return { text: '整理处理方案后回复游客', type: 'primary' }
  }
  return null
})

const pendingHours = computed(() => {
  if (!complaint.value || !complaint.value.created_at) return 0
  const created = new Date(complaint.value.created_at)
  const now = new Date()
  return Math.round((now.getTime() - created.getTime()) / (1000 * 60 * 60) * 10) / 10
})

const isOverdue = computed(() => {
  return complaint.value && complaint.value.status !== 'replied' && pendingHours.value >= 2
})

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const res = await complaintApi.get(id)
    complaint.value = res.data
    const logsRes = await logsApi.list({ entity_type: 'complaint', entity_id: id })
    logs.value = logsRes.data

    try {
      const relRes = await complaintApi.getRelatedReservation(id)
      relatedReservation.value = relRes.data
    } catch {}
  } catch {
    router.push({ name: 'complaints' })
  }
  loading.value = false
})

async function handleAccept() {
  if (!complaint.value) return
  handling.value = true
  try {
    const res = await complaintApi.handle(complaint.value.id, auth.currentUser!.display_name)
    complaint.value = res.data
    const logsRes = await logsApi.list({ entity_type: 'complaint', entity_id: complaint.value.id })
    logs.value = logsRes.data
  } catch {}
  handling.value = false
}

async function handleReply() {
  if (!complaint.value || !replyContent.value.trim()) return
  replying.value = true
  try {
    const res = await complaintApi.reply(complaint.value.id, {
      reply_content: replyContent.value,
      handler_name: auth.currentUser!.display_name,
    })
    complaint.value = res.data
    showReplyDialog.value = false
    replyContent.value = ''
    const logsRes = await logsApi.list({ entity_type: 'complaint', entity_id: complaint.value.id })
    logs.value = logsRes.data
  } catch {}
  replying.value = false
}

function goToReservation(id: number) {
  router.push({ name: 'reservation-detail', params: { id } })
}

function formatTime(t: string | null) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN')
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-ghost btn-sm" @click="router.push({ name: 'complaints' })">← 返回</button>
        <h1 class="page-title">投诉详情</h1>
      </div>
      <div v-if="complaint" class="flex gap-2">
        <span class="badge" :class="{
          'badge-danger': complaint.status === 'pending',
          'badge-warning': complaint.status === 'processing',
          'badge-success': complaint.status === 'replied',
        }">{{ STATUS_LABELS[complaint.status] }}</span>
        <span v-if="isOverdue" class="badge badge-danger">⏰ 已超{{ pendingHours }}小时未回复</span>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else-if="complaint">
      <div v-if="complaint.status === 'pending'" class="alert alert-danger">
        ⚠️ 此投诉尚未受理，游客正在等待回复。
        <span v-if="pendingHours >= 2">已等待{{ pendingHours }}小时，请尽快处理！</span>
      </div>

      <div v-if="isOverdue && complaint.status === 'processing'" class="alert alert-warning">
        ⏰ 此投诉已处理{{ pendingHours }}小时但尚未回复游客，请尽快完成回复。
      </div>

      <div v-if="nextAction" class="next-action-banner" :class="nextAction.type === 'danger' ? 'banner-danger' : ''">
        <div class="next-action-info">
          <span class="next-action-label">👉 下一步：</span>
          <span class="next-action-desc">{{ nextAction.text }}</span>
        </div>
      </div>

      <div class="card workflow-card">
        <h3 class="card-title">🔄 投诉处理流程</h3>
        <div class="status-flow">
          <div
            v-for="(s, i) in complaintSteps"
            :key="s.key"
            class="status-step"
            :class="{
              'step-active': complaint.status === s.key,
              'step-done': s.done,
              'step-pending': !s.done && complaint.status !== s.key,
            }"
          >
            <div class="step-dot">{{ s.done ? '✓' : i + 1 }}</div>
            <div class="step-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">💬 投诉内容</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">游客</span>
            <span class="detail-value">{{ complaint.visitor_name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">电话</span>
            <span class="detail-value">{{ complaint.visitor_phone }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">类别</span>
            <span class="detail-value"><span class="badge badge-gray">{{ complaint.category }}</span></span>
          </div>
          <div class="detail-item">
            <span class="detail-label">提交时间</span>
            <span class="detail-value text-sm">{{ formatTime(complaint.created_at) }}</span>
          </div>
        </div>
        <div class="complaint-content-box mt-4">
          {{ complaint.content }}
        </div>
      </div>

      <div v-if="relatedReservation" class="card related-card">
        <h3 class="card-title">🔗 关联预约信息</h3>
        <div class="related-grid">
          <div class="detail-item">
            <span class="detail-label">游客</span>
            <span class="detail-value">{{ relatedReservation.visitor_name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预约日期</span>
            <span class="detail-value">{{ relatedReservation.reserved_date }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">果品</span>
            <span class="detail-value">{{ relatedReservation.fruit_type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预约量/实际量</span>
            <span class="detail-value">{{ relatedReservation.reserved_qty }}斤 / {{ relatedReservation.actual_qty || '未确认' }}斤</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预约状态</span>
            <span class="detail-value">
              <span class="badge" :class="{
                'badge-warning': relatedReservation.status === 'pending',
                'badge-info': relatedReservation.status === 'confirmed',
                'badge-success': relatedReservation.status === 'completed',
              }">{{ STATUS_LABELS[relatedReservation.status] }}</span>
              <span v-if="relatedReservation.overbook_flag" class="badge badge-danger" style="margin-left:4px">超量</span>
            </span>
          </div>
        </div>
        <button class="btn btn-outline btn-sm mt-4" @click="goToReservation(relatedReservation.id)">查看预约详情 →</button>
      </div>

      <div v-if="complaint.reply_content" class="card">
        <h3 class="card-title">✅ 回复内容</h3>
        <div class="reply-box">
          <div class="reply-meta">
            <span>回复人: {{ complaint.handler_name }}</span>
            <span class="text-sm text-gray">{{ formatTime(complaint.updated_at) }}</span>
          </div>
          <div class="reply-text">{{ complaint.reply_content }}</div>
        </div>
      </div>

      <div v-if="logs.length > 0" class="card">
        <h3 class="card-title">📋 处理记录（历史备注）</h3>
        <div class="timeline">
          <div v-for="log in logs" :key="log.id" class="timeline-item">
            <div class="timeline-header">
              <span class="timeline-time">{{ formatTime(log.created_at) }}</span>
              <span class="timeline-operator">
                <span class="op-role-badge" :class="'op-' + log.operator_role">
                  {{ ROLE_LABELS[log.operator_role] || log.operator_role }}
                </span>
                {{ log.operator_name }}
              </span>
            </div>
            <div class="timeline-action">{{ log.action }}</div>
            <div v-if="log.notes" class="timeline-notes">💬 {{ log.notes }}</div>
          </div>
        </div>
      </div>

      <div class="card" v-if="complaint.status !== 'replied'">
        <h3 class="card-title">⚙️ 操作</h3>
        <div class="flex gap-3">
          <button
            v-if="complaint.status === 'pending'"
            class="btn btn-warning"
            @click="handleAccept"
            :disabled="handling"
          >
            {{ handling ? '受理中...' : '📋 受理投诉' }}
          </button>
          <button
            v-if="complaint.status === 'processing'"
            class="btn btn-primary"
            @click="showReplyDialog = true"
          >
            ✉️ 回复投诉
          </button>
        </div>
      </div>
    </template>

    <div v-if="showReplyDialog" class="dialog-overlay" @click.self="showReplyDialog = false">
      <div class="dialog">
        <h3>回复投诉</h3>
        <p class="text-sm text-gray mb-4">回复后游客将收到通知，此操作不可撤销。</p>
        <div v-if="relatedReservation" class="alert alert-info mb-4">
          关联预约: {{ relatedReservation.visitor_name }}预约{{ relatedReservation.fruit_type }}{{ relatedReservation.reserved_qty }}斤，
          实际{{ relatedReservation.actual_qty || '未确认' }}斤
        </div>
        <div class="form-group">
          <label class="form-label">回复内容</label>
          <textarea v-model="replyContent" class="form-textarea" rows="4" placeholder="详细说明处理方案和补偿措施"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showReplyDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleReply" :disabled="replying || !replyContent.trim()">
            {{ replying ? '回复中...' : '确认回复' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.next-action-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border-left: 4px solid var(--warning);
  border-radius: 8px;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}
.banner-danger {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%) !important;
  border-left-color: var(--danger) !important;
}
.next-action-label {
  font-weight: 700;
  font-size: 15px;
  color: var(--gray-800);
  margin-right: 8px;
}
.next-action-desc {
  font-size: 13px;
  color: var(--gray-600);
}

.workflow-card {
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%);
}

.related-card {
  border-left: 4px solid var(--info);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.status-flow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}
.status-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  flex: 1;
}
.status-step:not(:last-child)::after {
  content: '';
  position: absolute;
  top: 12px;
  left: 55%;
  right: -45%;
  height: 2px;
  background: var(--gray-300);
}
.step-done:not(:last-child)::after {
  background: var(--primary);
}
.step-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--gray-300);
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.step-active .step-dot {
  background: var(--warning);
  box-shadow: 0 0 0 4px #fff3e0;
}
.step-done .step-dot {
  background: var(--primary);
}
.step-pending .step-dot {
  background: var(--gray-300);
  color: var(--gray-600);
}
.step-label {
  font-size: 12px;
  color: var(--gray-500);
}
.step-active .step-label {
  color: var(--warning);
  font-weight: 700;
}
.step-done .step-label {
  color: var(--primary);
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.detail-label {
  display: block;
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 2px;
}

.detail-value {
  font-size: 14px;
  color: var(--gray-800);
}

.complaint-content-box {
  background: var(--gray-50);
  border-radius: 6px;
  padding: 12px 16px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--gray-800);
}

.reply-box {
  background: var(--success-light);
  border-radius: 6px;
  padding: 12px 16px;
}

.reply-meta {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: var(--gray-600);
  margin-bottom: 8px;
}

.reply-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--gray-800);
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}
.op-role-badge {
  display: inline-block;
  padding: 1px 6px;
  border-radius: 3px;
  font-size: 11px;
  font-weight: 600;
  margin-right: 4px;
}
.op-customer_service { background: #e3f2fd; color: #1565c0; }
.op-picking_guide { background: #fff3e0; color: #e65100; }
.op-warehouse { background: #e8f5e9; color: #2e7d32; }
.op-system { background: #f3e5f5; color: #6a1b9a; }

.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.dialog {
  background: #fff;
  border-radius: 12px;
  padding: 24px;
  width: 480px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
}

.dialog h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: repeat(2, 1fr); }
  .related-grid { grid-template-columns: repeat(2, 1fr); }
  .status-flow { flex-wrap: wrap; gap: 12px; }
  .status-step::after { display: none; }
}
</style>
