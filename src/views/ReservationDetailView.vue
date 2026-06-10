<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { reservationApi, logsApi } from '../api/resources'
import { STATUS_LABELS, ROLE_LABELS, GRADE_LABELS } from '../types'
import { useAuthStore } from '../stores/auth'
import type { Reservation, ProcessingLog } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const reservation = ref<Reservation | null>(null)
const logs = ref<ProcessingLog[]>([])
const loading = ref(true)
const confirming = ref(false)
const completing = ref(false)
const actualQty = ref(0)
const confirmNotes = ref('')
const completeNotes = ref('')
const showConfirmDialog = ref(false)
const showCompleteDialog = ref(false)
const availableInventory = ref<{ fruit_type: string; total_available: number; grade_breakdown: Record<string, number> } | null>(null)
const completeCheck = ref<{ available_abc: number; max_completable_qty: number; can_complete_full: boolean } | null>(null)
const completeError = ref('')

const reservationSteps = computed(() => {
  if (!reservation.value) return []
  return [
    { key: 'pending', label: '提交预约', done: true },
    { key: 'confirmed', label: '确认预约', done: ['confirmed', 'completed'].includes(reservation.value.status) },
    { key: 'completed', label: '采摘完成', done: reservation.value.status === 'completed' },
  ]
})

const nextAction = computed(() => {
  if (!reservation.value) return null
  if (reservation.value.overbook_flag === 1 && reservation.value.status === 'pending') {
    return { text: '先确认库存调配方案，再确认预约', type: 'danger' }
  }
  if (reservation.value.status === 'pending') {
    return { text: '确认此预约', type: 'primary' }
  }
  if (reservation.value.status === 'confirmed') {
    return { text: '游客采摘完成后点击完成预约（库存将自动扣减）', type: 'success' }
  }
  return null
})

const inventorySufficient = computed(() => {
  if (!availableInventory.value || !reservation.value) return null
  return availableInventory.value.total_available >= reservation.value.reserved_qty
})

onMounted(async () => {
  const id = Number(route.params.id)
  try {
    const res = await reservationApi.get(id)
    reservation.value = res.data
    actualQty.value = res.data.reserved_qty
    const logsRes = await logsApi.list({ entity_type: 'reservation', entity_id: id })
    logs.value = logsRes.data

    if (res.data.status !== 'completed') {
      try {
        const invRes = await reservationApi.getAvailableInventory(res.data.fruit_type)
        availableInventory.value = invRes.data
      } catch {}
    }
    if (res.data.status === 'confirmed') {
      try {
        const checkRes = await reservationApi.completeCheck(id)
        completeCheck.value = checkRes.data
      } catch {}
    }
  } catch {
    router.push({ name: 'reservations' })
  }
  loading.value = false
})

async function handleConfirm() {
  if (!reservation.value) return
  confirming.value = true
  try {
    const res = await reservationApi.confirm(
      reservation.value.id,
      auth.currentUser!.display_name,
      actualQty.value !== reservation.value.reserved_qty ? actualQty.value : undefined,
      confirmNotes.value,
    )
    reservation.value = res.data
    showConfirmDialog.value = false
    confirmNotes.value = ''
    const logsRes = await logsApi.list({ entity_type: 'reservation', entity_id: reservation.value.id })
    logs.value = logsRes.data
  } catch {}
  confirming.value = false
}

async function handleComplete() {
  if (!reservation.value) return
  completeError.value = ''
  if (completeCheck.value && actualQty.value > completeCheck.value.max_completable_qty) {
    completeError.value = `库存不足！当前${reservation.value.fruit_type}ABC级可用库存仅${completeCheck.value.available_abc}斤，无法完成${actualQty.value}斤。请调整实际采摘量或先调配库存。`
    return
  }
  completing.value = true
  try {
    const res = await reservationApi.complete(
      reservation.value.id,
      auth.currentUser!.display_name,
      actualQty.value,
      completeNotes.value,
    )
    reservation.value = res.data
    showCompleteDialog.value = false
    completeNotes.value = ''
    const logsRes = await logsApi.list({ entity_type: 'reservation', entity_id: reservation.value.id })
    logs.value = logsRes.data
  } catch (e: any) {
    const detail = e.response?.data?.detail
    if (detail) {
      completeError.value = detail
    }
  }
  completing.value = false
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
        <button class="btn btn-ghost btn-sm" @click="router.push({ name: 'reservations' })">← 返回</button>
        <h1 class="page-title">预约详情</h1>
      </div>
      <div v-if="reservation" class="flex gap-2">
        <span class="badge" :class="{
          'badge-warning': reservation.status === 'pending',
          'badge-info': reservation.status === 'confirmed',
          'badge-success': reservation.status === 'completed',
        }">{{ STATUS_LABELS[reservation.status] }}</span>
        <span v-if="reservation.overbook_flag" class="badge badge-danger">⚠️ 超量预约</span>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else-if="reservation">
      <div v-if="reservation.overbook_flag && reservation.status === 'pending'" class="alert alert-danger">
        ⚠️ 此预约当日果品预约量已超AB级库存上限，需要确认调配方案后再确认预约。
      </div>

      <div v-if="nextAction" class="next-action-banner" :class="nextAction.type === 'danger' ? 'banner-danger' : ''">
        <div class="next-action-info">
          <span class="next-action-label">👉 下一步：</span>
          <span class="next-action-desc">{{ nextAction.text }}</span>
        </div>
      </div>

      <div v-if="availableInventory && reservation.status !== 'completed'" class="card inventory-card">
        <h3 class="card-title">📊 当前库存对照（{{ reservation.fruit_type }}）</h3>
        <div class="inv-compare">
          <div class="inv-compare-item">
            <div class="inv-compare-label">AB级可售库存</div>
            <div class="inv-compare-value" :class="inventorySufficient ? 'text-green' : 'text-red'">
              {{ (availableInventory.grade_breakdown['A'] || 0) + (availableInventory.grade_breakdown['B'] || 0) }} 斤
            </div>
          </div>
          <div class="inv-compare-item">
            <div class="inv-compare-label">本次预约量</div>
            <div class="inv-compare-value">{{ reservation.reserved_qty }} 斤</div>
          </div>
          <div class="inv-compare-item">
            <div class="inv-compare-label">预约后剩余</div>
            <div class="inv-compare-value" :class="(availableInventory.grade_breakdown['A'] || 0) + (availableInventory.grade_breakdown['B'] || 0) - reservation.reserved_qty >= 0 ? 'text-green' : 'text-red'">
              {{ (availableInventory.grade_breakdown['A'] || 0) + (availableInventory.grade_breakdown['B'] || 0) - reservation.reserved_qty }} 斤
            </div>
          </div>
        </div>
        <div class="grade-breakdown">
          <span v-for="(qty, grade) in availableInventory.grade_breakdown" :key="grade" class="grade-chip" :class="'grade-chip-' + grade.toLowerCase()">
            {{ GRADE_LABELS[grade] || grade + '级' }}: {{ qty }}斤
          </span>
        </div>
        <div v-if="!inventorySufficient && reservation.overbook_flag" class="alert alert-warning mt-4">
          ⚠️ 库存不足，建议方案：1) 从其他采摘区调配 2) 调整预约量为{{ (availableInventory.grade_breakdown['A'] || 0) + (availableInventory.grade_breakdown['B'] || 0) }}斤 3) 通知游客改期
        </div>
      </div>

      <div class="card workflow-card">
        <h3 class="card-title">🔄 预约处理流程</h3>
        <div class="status-flow">
          <div
            v-for="(s, i) in reservationSteps"
            :key="s.key"
            class="status-step"
            :class="{
              'step-active': reservation.status === s.key,
              'step-done': s.done,
              'step-pending': !s.done && reservation.status !== s.key,
            }"
          >
            <div class="step-dot">{{ s.done ? '✓' : i + 1 }}</div>
            <div class="step-label">{{ s.label }}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="card-title">📅 预约信息</h3>
        <div class="detail-grid">
          <div class="detail-item">
            <span class="detail-label">游客姓名</span>
            <span class="detail-value">{{ reservation.visitor_name }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">联系电话</span>
            <span class="detail-value">{{ reservation.visitor_phone }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预约日期</span>
            <span class="detail-value">{{ reservation.reserved_date }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">果品</span>
            <span class="detail-value">{{ reservation.fruit_type }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">预约量</span>
            <span class="detail-value">{{ reservation.reserved_qty }} 斤</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">实际量</span>
            <span class="detail-value">{{ reservation.actual_qty > 0 ? reservation.actual_qty + ' 斤' : '未确认' }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">处理人</span>
            <span class="detail-value">{{ reservation.handler_name || '未分配' }}</span>
          </div>
        </div>
      </div>

      <div v-if="reservation.notes" class="card">
        <h3 class="card-title">📝 历史备注</h3>
        <div class="notes-content">
          <div v-for="(line, idx) in reservation.notes.split('\n').filter(l => l.trim())" :key="idx" class="note-line">
            {{ line }}
          </div>
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

      <div class="card" v-if="reservation.status !== 'completed'">
        <h3 class="card-title">⚙️ 操作</h3>
        <div class="flex gap-3">
          <button
            v-if="reservation.status === 'pending'"
            class="btn btn-primary"
            @click="showConfirmDialog = true; actualQty = reservation.reserved_qty"
          >
            ✅ 确认预约
          </button>
          <button
            v-if="reservation.status === 'confirmed'"
            class="btn btn-primary"
            @click="showCompleteDialog = true; actualQty = reservation.reserved_qty"
          >
            🏁 完成预约（扣减库存）
          </button>
        </div>
      </div>
    </template>

    <div v-if="showConfirmDialog" class="dialog-overlay" @click.self="showConfirmDialog = false">
      <div class="dialog">
        <h3>确认预约</h3>
        <p class="text-sm text-gray mb-4">确认后向导将收到通知安排采摘。</p>
        <div v-if="availableInventory" class="alert alert-info mb-4">
          当前{{ reservation?.fruit_type }}AB级库存: {{ (availableInventory.grade_breakdown['A'] || 0) + (availableInventory.grade_breakdown['B'] || 0) }}斤
        </div>
        <div class="form-group">
          <label class="form-label">实际可预约量（如与预约量不同请修改）</label>
          <input type="number" v-model.number="actualQty" min="0" step="0.5" class="form-input" />
        </div>
        <div class="form-group">
          <label class="form-label">确认备注</label>
          <textarea v-model="confirmNotes" class="form-textarea" placeholder="记录确认说明，如库存调配方案等"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showConfirmDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleConfirm" :disabled="confirming">
            {{ confirming ? '确认中...' : '确认预约' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="showCompleteDialog" class="dialog-overlay" @click.self="showCompleteDialog = false">
      <div class="dialog">
        <h3>完成预约</h3>
        <p class="text-sm text-gray mb-4">完成后系统将自动从库存中扣减对应数量。</p>
        <div v-if="completeCheck" class="alert" :class="completeCheck.can_complete_full ? 'alert-info' : 'alert-danger'" >
          当前{{ reservation?.fruit_type }}ABC级可用库存: {{ completeCheck.available_abc }}斤
          <span v-if="!completeCheck.can_complete_full"> · ⚠️ 不足以完成原预约量{{ reservation?.reserved_qty }}斤，最多可完成{{ completeCheck.max_completable_qty }}斤</span>
        </div>
        <div v-if="completeError" class="alert alert-danger">
          ⚠️ {{ completeError }}
        </div>
        <div class="form-group">
          <label class="form-label">实际采摘量(斤)</label>
          <input type="number" v-model.number="actualQty" min="0" step="0.5" class="form-input" />
          <div v-if="completeCheck && actualQty > completeCheck.max_completable_qty" class="text-sm text-red mt-1">
            ⚠️ 输入量超出可用库存{{ completeCheck.available_abc }}斤
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">完成备注</label>
          <textarea v-model="completeNotes" class="form-textarea" placeholder="记录实际采摘情况，如差异原因等"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showCompleteDialog = false; completeError = ''">取消</button>
          <button class="btn btn-primary" @click="handleComplete" :disabled="completing || (completeCheck ? actualQty > completeCheck.max_completable_qty : false)">
            {{ completing ? '处理中...' : '确认完成（扣减库存）' }}
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

.inventory-card {
  border-left: 4px solid var(--info);
}

.inv-compare {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 12px;
}

.inv-compare-item {
  text-align: center;
  padding: 12px;
  background: var(--gray-50);
  border-radius: 8px;
}

.inv-compare-label {
  font-size: 12px;
  color: var(--gray-500);
  margin-bottom: 4px;
}

.inv-compare-value {
  font-size: 22px;
  font-weight: 700;
}

.text-green { color: var(--success); }
.text-red { color: var(--danger); }
.mt-1 { margin-top: 4px; }

.grade-breakdown {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.grade-chip {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.grade-chip-a { background: #e8f5e9; color: #2e7d32; }
.grade-chip-b { background: #fff3e0; color: #e65100; }
.grade-chip-c { background: #fff8e1; color: #f57f17; }
.grade-chip-d { background: #fce4ec; color: #c62828; }

.workflow-card {
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%);
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

.notes-content {
  background: var(--gray-50);
  border-radius: 6px;
  padding: 12px 16px;
}

.note-line {
  font-size: 13px;
  color: var(--gray-700);
  padding: 4px 0;
  border-bottom: 1px dashed var(--gray-200);
}

.note-line:last-child {
  border-bottom: none;
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
  .inv-compare { grid-template-columns: 1fr; }
  .status-flow { flex-wrap: wrap; gap: 12px; }
  .status-step::after { display: none; }
}
</style>
