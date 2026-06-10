<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { batchApi, gradingApi, logsApi, pickingLossApi, inventoryApi } from '../api/resources'
import { STATUS_LABELS, GRADE_LABELS, ROLE_LABELS } from '../types'
import { useAuthStore } from '../stores/auth'
import type { FruitBatch, GradingRecord, ProcessingLog, PickingLoss } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const batch = ref<FruitBatch | null>(null)
const gradingRecords = ref<GradingRecord[]>([])
const logs = ref<ProcessingLog[]>([])
const losses = ref<PickingLoss[]>([])
const loading = ref(true)
const showLossReport = ref(false)
const reportingLoss = ref(false)
const lossForm = ref({ expected_qty: 0, actual_qty: 0, loss_reason: '' })

const nextAction = computed(() => {
  if (!batch.value) return null
  const role = auth.currentUser?.role
  const status = batch.value.status
  if (role === 'picking_guide') {
    if (status === 'picked' && losses.value.length === 0) {
      return { text: '上报采摘损耗', action: 'reportLoss', type: 'warning' }
    }
  }
  if (role === 'warehouse') {
    if (status === 'picked' && gradingRecords.value.length === 0) {
      return { text: '开始果品分级', action: 'startGrading', type: 'primary' }
    }
    if (status === 'grading') {
      const pending = gradingRecords.value.find(g => g.status === 'pending')
      if (pending) {
        return { text: '继续分级并确认入库', action: 'continueGrading', type: 'primary', data: pending.id }
      }
      return { text: '开始果品分级', action: 'startGrading', type: 'primary' }
    }
    if (status === 'graded') {
      return { text: '开始入库', action: 'confirmWarehousing', type: 'primary' }
    }
    if (status === 'warehousing') {
      return { text: '确认入库完成', action: 'confirmWarehousing', type: 'success' }
    }
  }
  return null
})

const workflowSteps = computed(() => {
  if (!batch.value) return []
  const s = batch.value.status
  const steps = [
    { key: 'picked', label: '采摘提交', done: true },
    { key: 'loss', label: '损耗上报', done: losses.value.length > 0 },
    { key: 'grading', label: '果品分级', done: ['graded', 'warehousing', 'stored'].includes(s) },
    { key: 'warehousing', label: '入库中', done: s === 'stored', inProgress: s === 'warehousing' },
    { key: 'stored', label: '已入库', done: s === 'stored' },
  ]
  const statusToStepIdx: Record<string, number> = {
    picked: 0, grading: 2, graded: 3, warehousing: 3, stored: 4,
  }
  const curIdx = statusToStepIdx[s] ?? 0
  return steps.map((step, i) => ({
    ...step,
    active: step.inProgress || (i === curIdx && !step.done),
    order: i,
  }))
})

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const batchRes = await batchApi.get(id)
    batch.value = batchRes.data
    const [logsRes, gradingRes, lossRes] = await Promise.all([
      logsApi.getByBatch(id),
      gradingApi.list(),
      pickingLossApi.list({ batch_id: id }),
    ])
    logs.value = logsRes.data
    gradingRecords.value = gradingRes.data.filter(g => g.batch_id === id)
    losses.value = lossRes.data
  } catch {
    router.push({ name: 'dashboard' })
  }
  loading.value = false
})

async function updateStatus(status: string) {
  if (!batch.value) return
  try {
    const res = await batchApi.updateStatus(batch.value.id, {
      status,
      operator_name: auth.currentUser!.display_name,
    })
    batch.value = res.data
    const logsRes = await logsApi.getByBatch(batch.value.id)
    logs.value = logsRes.data
  } catch (e: any) {
    alert(e.response?.data?.detail || '操作失败')
  }
}

function goToGrading(gradingId: number) {
  router.push({ name: 'grading-detail', params: { id: gradingId } })
}

function startGrading(batchId: number) {
  router.push({ name: 'grading-new', params: { batchId } })
}

function continueGrading(gradingId: number) {
  router.push({ name: 'grading-detail', params: { id: gradingId } })
}

function openLossReport() {
  if (!batch.value) return
  lossForm.value = {
    expected_qty: batch.value.quantity_picked,
    actual_qty: batch.value.quantity_picked,
    loss_reason: '',
  }
  showLossReport.value = true
}

async function handleLossReport() {
  if (!batch.value) return
  reportingLoss.value = true
  try {
    await pickingLossApi.create(
      {
        batch_id: batch.value.id,
        expected_qty: lossForm.value.expected_qty,
        actual_qty: lossForm.value.actual_qty,
        loss_reason: lossForm.value.loss_reason,
      },
      auth.currentUser!.display_name,
    )
    showLossReport.value = false
    const lossRes = await pickingLossApi.list({ batch_id: batch.value.id })
    losses.value = lossRes.data
    const logsRes = await logsApi.getByBatch(batch.value.id)
    logs.value = logsRes.data
  } catch (e: any) {
    alert(e.response?.data?.detail || '上报失败')
  }
  reportingLoss.value = false
}

async function confirmWarehousing() {
  if (!batch.value) return
  const isGraded = batch.value.status === 'graded'
  const isWarehousing = batch.value.status === 'warehousing'
  if (isGraded) {
    if (!confirm(`确认开始入库？批次${batch.value.batch_no}将由"已分级"变为"入库中"。`)) return
  } else if (isWarehousing) {
    if (!confirm(`确认入库完成？批次${batch.value.batch_no}将标记为"已入库"。`)) return
  }
  try {
    await inventoryApi.confirmWarehousing(batch.value.id, auth.currentUser!.display_name)
    const res = await batchApi.get(batch.value.id)
    batch.value = res.data
    const logsRes = await logsApi.getByBatch(batch.value.id)
    logs.value = logsRes.data
  } catch (e: any) {
    alert(e.response?.data?.detail || '确认失败')
  }
}

function handleNextAction(action: any) {
  switch (action.action) {
    case 'reportLoss': openLossReport(); break
    case 'startGrading': startGrading(batch.value!.id); break
    case 'continueGrading': continueGrading(action.data); break
    case 'confirmWarehousing': confirmWarehousing(); break
  }
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
        <button class="btn btn-ghost btn-sm" @click="router.back()">← 返回</button>
        <h1 class="page-title">批次详情</h1>
      </div>
      <div v-if="batch" class="flex gap-2 items-center">
        <span class="badge" :class="{
          'badge-gray': batch.status === 'picked',
          'badge-info': batch.status === 'grading',
          'badge-warning': batch.status === 'graded',
          'badge-primary': batch.status === 'warehousing',
          'badge-success': batch.status === 'stored',
        }">{{ STATUS_LABELS[batch.status] }}</span>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else-if="batch">
      <div v-if="nextAction" class="next-action-banner">
        <div class="next-action-info">
          <span class="next-action-label">👉 下一步操作：</span>
          <span class="next-action-desc">
            {{ auth.currentUser?.role === 'picking_guide' ? '采摘向导' : auth.currentUser?.role === 'warehouse' ? '仓库员' : '客服' }}
            请完成以下操作以推进流程
          </span>
        </div>
        <button
          class="btn"
          :class="{
            'btn-primary': nextAction.type === 'primary',
            'btn-warning': nextAction.type === 'warning',
            'btn-success': nextAction.type === 'success',
          }"
          @click="handleNextAction(nextAction)"
        >
          {{ nextAction.text }} →
        </button>
      </div>

      <div class="card workflow-card">
        <h3 class="card-title">🔄 处理流程进度</h3>
        <div class="status-flow">
          <div
            v-for="s in workflowSteps"
            :key="s.key"
            class="status-step"
            :class="{
              'step-active': s.active,
              'step-done': s.done,
              'step-pending': !s.done && !s.active,
            }"
          >
            <div class="step-dot">{{ s.done ? '✓' : s.order + 1 }}</div>
            <div class="step-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">📦 批次基本信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">批次号</span>
            <span class="detail-value font-bold">{{ batch.batch_no }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">果品</span>
            <span class="detail-value">{{ batch.fruit_type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">采摘日期</span>
            <span class="detail-value">{{ batch.picking_date }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">采摘区</span>
            <span class="detail-value">{{ batch.picking_area }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">采摘量</span>
            <span class="detail-value">{{ batch.quantity_picked }}{{ batch.unit }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">向导</span>
            <span class="detail-value">{{ batch.guide_name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">创建时间</span>
            <span class="detail-value text-sm">{{ formatTime(batch.created_at) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">当前状态</span>
            <span class="detail-value">
              <span class="badge" :class="{
                'badge-gray': batch.status === 'picked',
                'badge-info': batch.status === 'grading',
                'badge-warning': batch.status === 'graded',
                'badge-primary': batch.status === 'warehousing',
                'badge-success': batch.status === 'stored',
              }">{{ STATUS_LABELS[batch.status] }}</span>
            </span>
          </div>
        </div>
      </div>

      <div v-if="gradingRecords.length > 0" class="card">
        <h3 class="card-title">🏷️ 分级记录</h3>
        <div v-for="gr in gradingRecords" :key="gr.id" class="grading-summary">
          <div class="flex justify-between items-center mb-2">
            <div>
              <span class="font-bold">分级 #{{ gr.id }}</span>
              <span v-if="gr.grader_name" class="text-sm text-gray ml-3">分级员: {{ gr.grader_name }}</span>
            </div>
            <span class="badge" :class="gr.status === 'confirmed' ? 'badge-success' : 'badge-warning'">
              {{ gr.status === 'confirmed' ? '已确认入库' : '待确认' }}
            </span>
          </div>
          <div class="grade-row">
            <span class="grade-tag grade-a-tag">A级: {{ gr.grade_a_qty }}斤</span>
            <span class="grade-tag grade-b-tag">B级: {{ gr.grade_b_qty }}斤</span>
            <span class="grade-tag grade-c-tag">C级: {{ gr.grade_c_qty }}斤</span>
            <span class="grade-tag grade-d-tag">D级: {{ gr.grade_d_qty }}斤</span>
            <span class="grade-tag grade-total-tag">合计: {{ gr.grade_a_qty + gr.grade_b_qty + gr.grade_c_qty + gr.grade_d_qty }}斤</span>
          </div>
          <div v-if="gr.status === 'confirmed'" class="mt-2 p-2 rounded success-bg text-sm">
            ✅ 此分级已确认，各级库存已自动入库
          </div>
          <div class="flex gap-2 mt-2">
            <button class="btn btn-outline btn-sm" @click="goToGrading(gr.id)">查看分级详情</button>
            <button
              v-if="gr.status === 'pending' && auth.currentUser?.role === 'warehouse'"
              class="btn btn-primary btn-sm"
              @click="goToGrading(gr.id)"
            >
              确认分级入库
            </button>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header-row">
          <h3 class="card-title">📉 采摘损耗</h3>
          <button
            v-if="losses.length === 0 && auth.currentUser?.role === 'picking_guide' && batch.status === 'picked'"
            class="btn btn-warning btn-sm"
            @click="openLossReport"
          >
            上报损耗
          </button>
        </div>
        <div v-if="losses.length === 0" class="empty-state-sm">
          <p>暂未上报损耗（采摘向导可上报）</p>
        </div>
        <div v-for="loss in losses" :key="loss.id" class="loss-info">
          <div class="flex justify-between items-center">
            <span>预期: <strong>{{ loss.expected_qty }}斤</strong> → 实际: <strong>{{ loss.actual_qty }}斤</strong></span>
            <span class="badge" :class="loss.loss_rate > 5 ? 'badge-danger' : 'badge-warning'">
              损耗 {{ loss.loss_qty }}斤 ({{ loss.loss_rate.toFixed(1) }}%)
            </span>
          </div>
          <div v-if="loss.loss_reason" class="text-sm text-gray mt-2">📝 原因: {{ loss.loss_reason }}</div>
          <div class="text-xs text-gray mt-1">上报人: {{ loss.reporter_name }} · {{ formatTime(loss.created_at) }}</div>
        </div>
      </div>

      <div v-if="logs.length > 0" class="card">
        <h3 class="card-title">📋 完整处理记录（历史备注）</h3>
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

      <div class="card" v-if="auth.currentUser?.role === 'warehouse' && batch.status === 'picked' && gradingRecords.length === 0">
        <h3 class="card-title">⚙️ 快捷操作</h3>
        <button class="btn btn-primary" @click="startGrading(batch.id)">🏷️ 开始果品分级</button>
      </div>
    </template>

    <div v-if="showLossReport && batch" class="dialog-overlay" @click.self="showLossReport = false">
      <div class="dialog">
        <h3>上报采摘损耗 - {{ batch.batch_no }}</h3>
        <p class="text-sm text-gray mb-4">{{ batch.fruit_type }} · {{ batch.picking_area }}</p>
        <div class="grid-2">
          <div class="form-group">
            <label class="form-label">预期数量(斤)</label>
            <input v-model.number="lossForm.expected_qty" type="number" min="0" step="0.5" class="form-input" />
          </div>
          <div class="form-group">
            <label class="form-label">实际数量(斤)</label>
            <input v-model.number="lossForm.actual_qty" type="number" min="0" step="0.5" class="form-input" />
          </div>
        </div>
        <div v-if="lossForm.expected_qty > 0" class="alert" :class="lossForm.expected_qty - lossForm.actual_qty > 0 ? 'alert-warning' : 'alert-info'">
          损耗量: {{ (lossForm.expected_qty - lossForm.actual_qty).toFixed(1) }} 斤
          · 损耗率: {{ lossForm.expected_qty > 0 ? ((lossForm.expected_qty - lossForm.actual_qty) / lossForm.expected_qty * 100).toFixed(1) : 0 }}%
        </div>
        <div class="form-group">
          <label class="form-label">损耗原因</label>
          <textarea v-model="lossForm.loss_reason" class="form-textarea" placeholder="描述损耗原因，如运输损伤、天气、采摘手法等"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showLossReport = false">取消</button>
          <button class="btn btn-primary" @click="handleLossReport" :disabled="reportingLoss">
            {{ reportingLoss ? '上报中...' : '确认上报' }}
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

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
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
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { box-shadow: 0 0 0 4px #fff3e0; }
  50% { box-shadow: 0 0 0 8px #fff3e0; }
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

.grading-summary {
  padding: 12px;
  background: var(--gray-50);
  border-radius: 6px;
  margin-bottom: 8px;
}

.grade-row {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grade-tag {
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.grade-a-tag { background: #e8f5e9; color: #2e7d32; }
.grade-b-tag { background: #fff3e0; color: #e65100; }
.grade-c-tag { background: #fff8e1; color: #f57f17; }
.grade-d-tag { background: #fce4ec; color: #c62828; }
.grade-total-tag { background: #e3f2fd; color: #1565c0; }

.loss-info {
  padding: 12px;
  background: var(--warning-light);
  border-radius: 6px;
  margin-bottom: 8px;
}

.empty-state-sm {
  padding: 16px;
  text-align: center;
  color: var(--gray-500);
  font-size: 13px;
  background: var(--gray-50);
  border-radius: 6px;
}

.success-bg {
  background: var(--success-light);
  color: var(--success);
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

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .detail-grid { grid-template-columns: repeat(2, 1fr); }
  .status-flow { flex-wrap: wrap; gap: 12px; }
  .status-step::after { display: none; }
  .next-action-banner { flex-direction: column; align-items: flex-start; }
}
</style>
