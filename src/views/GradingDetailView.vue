<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { gradingApi, batchApi, logsApi } from '../api/resources'
import { STATUS_LABELS, GRADE_LABELS } from '../types'
import { useAuthStore } from '../stores/auth'
import type { FruitBatch, GradingRecord, ProcessingLog } from '../types'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const isNew = computed(() => route.name === 'grading-new')

const batch = ref<FruitBatch | null>(null)
const record = ref<GradingRecord | null>(null)
const logs = ref<ProcessingLog[]>([])
const loading = ref(true)
const saving = ref(false)
const confirming = ref(false)
const confirmNotes = ref('')
const showConfirmDialog = ref(false)

const form = ref({
  grade_a_qty: 0,
  grade_b_qty: 0,
  grade_c_qty: 0,
  grade_d_qty: 0,
  grading_notes: '',
})

const totalGraded = computed(() =>
  form.value.grade_a_qty + form.value.grade_b_qty + form.value.grade_c_qty + form.value.grade_d_qty
)

const isOverTotal = computed(() =>
  batch.value ? totalGraded.value > batch.value.quantity_picked : false
)

onMounted(async () => {
  if (isNew.value) {
    const batchId = Number(route.params.batchId)
    try {
      const res = await batchApi.get(batchId)
      batch.value = res.data
    } catch {
      router.push({ name: 'grading' })
      return
    }
  } else {
    const gradingId = Number(route.params.id)
    try {
      const res = await gradingApi.get(gradingId)
      record.value = res.data
      if (res.data.batch) batch.value = res.data.batch
      form.value = {
        grade_a_qty: res.data.grade_a_qty,
        grade_b_qty: res.data.grade_b_qty,
        grade_c_qty: res.data.grade_c_qty,
        grade_d_qty: res.data.grade_d_qty,
        grading_notes: res.data.grading_notes,
      }
      const logsRes = await logsApi.getByBatch(res.data.batch_id)
      logs.value = logsRes.data
    } catch {
      router.push({ name: 'grading' })
      return
    }
  }
  loading.value = false
})

async function handleSubmit() {
  if (!batch.value) return
  if (isOverTotal.value) {
    alert('分级总量不能超过采摘量')
    return
  }
  saving.value = true
  try {
    const res = await gradingApi.create({
      batch_id: batch.value.id,
      ...form.value,
    })
    record.value = res.data
    router.replace({ name: 'grading-detail', params: { id: res.data.id } })
  } catch (e: any) {
    alert(e.response?.data?.detail || '创建失败')
  }
  saving.value = false
}

async function handleConfirm() {
  if (!record.value) return
  confirming.value = true
  try {
    const res = await gradingApi.confirm(record.value.id, {
      operator_name: auth.currentUser!.display_name,
      notes: confirmNotes.value,
    })
    record.value = res.data
    showConfirmDialog.value = false
    const logsRes = await logsApi.getByBatch(res.data.batch_id)
    logs.value = logsRes.data
  } catch (e: any) {
    alert(e.response?.data?.detail || '确认失败')
  }
  confirming.value = false
}

function formatTime(t: string | null) {
  if (!t) return ''
  return new Date(t).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex items-center gap-3">
        <button class="btn btn-ghost btn-sm" @click="router.push({ name: 'grading' })">← 返回</button>
        <h1 class="page-title">{{ isNew ? '新建分级记录' : '分级详情' }}</h1>
      </div>
      <div v-if="record" class="flex gap-2">
        <span class="badge" :class="record.status === 'confirmed' ? 'badge-success' : 'badge-warning'">
          {{ record.status === 'confirmed' ? '已确认' : '待确认' }}
        </span>
      </div>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else>
      <div v-if="batch" class="card">
        <h3 class="card-title">📦 采摘批次信息</h3>
        <div class="batch-detail-grid">
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

      <div class="card">
        <h3 class="card-title">🏷️ 果品分级</h3>

        <template v-if="isNew || (record && record.status === 'pending')">
          <div class="alert alert-info" v-if="isNew">
            请根据果品实际品质，将采摘量分配到各个等级。各级别之和不应超过采摘总量。
          </div>

          <div class="grade-grid">
            <div class="grade-item">
              <div class="grade-header grade-a">
                <span class="grade-label">{{ GRADE_LABELS.A }}</span>
                <span class="grade-desc">果形端正、色泽鲜艳、无瑕疵</span>
              </div>
              <div class="grade-input">
                <input type="number" v-model.number="form.grade_a_qty" min="0" step="0.5" class="form-input" :disabled="!!record" />
                <span class="grade-unit">斤</span>
              </div>
            </div>
            <div class="grade-item">
              <div class="grade-header grade-b">
                <span class="grade-label">{{ GRADE_LABELS.B }}</span>
                <span class="grade-desc">果形较好、轻微色差、小面积碰伤</span>
              </div>
              <div class="grade-input">
                <input type="number" v-model.number="form.grade_b_qty" min="0" step="0.5" class="form-input" :disabled="!!record" />
                <span class="grade-unit">斤</span>
              </div>
            </div>
            <div class="grade-item">
              <div class="grade-header grade-c">
                <span class="grade-label">{{ GRADE_LABELS.C }}</span>
                <span class="grade-desc">果形一般、有明显碰伤、不影响食用</span>
              </div>
              <div class="grade-input">
                <input type="number" v-model.number="form.grade_c_qty" min="0" step="0.5" class="form-input" :disabled="!!record" />
                <span class="grade-unit">斤</span>
              </div>
            </div>
            <div class="grade-item">
              <div class="grade-header grade-d">
                <span class="grade-label">{{ GRADE_LABELS.D }}</span>
                <span class="grade-desc">破损、腐烂、不可直接销售</span>
              </div>
              <div class="grade-input">
                <input type="number" v-model.number="form.grade_d_qty" min="0" step="0.5" class="form-input" :disabled="!!record" />
                <span class="grade-unit">斤</span>
              </div>
            </div>
          </div>

          <div class="grade-summary">
            <span>分级总量: <strong>{{ totalGraded }}</strong> 斤</span>
            <span v-if="batch"> / 采摘量: <strong>{{ batch.quantity_picked }}</strong> 斤</span>
            <span v-if="isOverTotal" class="badge badge-danger">超出采摘量！</span>
            <span v-else-if="batch && totalGraded < batch.quantity_picked" class="text-sm text-gray">
              (未分配: {{ (batch.quantity_picked - totalGraded).toFixed(1) }} 斤，可能为运输损耗)
            </span>
          </div>

          <div class="form-group" v-if="isNew">
            <label class="form-label">分级备注</label>
            <textarea v-model="form.grading_notes" class="form-textarea" placeholder="记录分级过程中发现的问题、特殊情况等"></textarea>
          </div>

          <div class="flex gap-2 mt-4" v-if="isNew">
            <button class="btn btn-primary" @click="handleSubmit" :disabled="saving || totalGraded === 0">
              {{ saving ? '保存中...' : '提交分级记录' }}
            </button>
          </div>

          <div class="flex gap-2 mt-4" v-else-if="record && record.status === 'pending'">
            <button class="btn btn-primary" @click="showConfirmDialog = true">
              ✅ 确认分级并更新库存
            </button>
          </div>
        </template>

        <template v-else-if="record && record.status === 'confirmed'">
          <div class="grade-grid">
            <div class="grade-item" v-for="(qty, grade) in { A: record.grade_a_qty, B: record.grade_b_qty, C: record.grade_c_qty, D: record.grade_d_qty }" :key="grade">
              <div class="grade-header" :class="'grade-' + grade.toLowerCase()">
                <span class="grade-label">{{ GRADE_LABELS[grade] }}</span>
              </div>
              <div class="grade-value">{{ qty }} 斤</div>
            </div>
          </div>
          <div class="alert alert-success mt-4">
            ✅ 分级已确认，库存已自动更新
          </div>
        </template>
      </div>

      <div v-if="record && record.grading_notes" class="card">
        <h3 class="card-title">📝 历史备注</h3>
        <div class="notes-content">
          <div v-for="(line, idx) in record.grading_notes.split('\n').filter(l => l.trim())" :key="idx" class="note-line">
            {{ line }}
          </div>
        </div>
      </div>

      <div v-if="logs.length > 0" class="card">
        <h3 class="card-title">📋 处理记录</h3>
        <div class="timeline">
          <div v-for="log in logs" :key="log.id" class="timeline-item">
            <div class="timeline-time">{{ formatTime(log.created_at) }}</div>
            <div class="timeline-action">{{ log.action }}</div>
            <div v-if="log.notes" class="timeline-notes">{{ log.notes }}</div>
            <div class="timeline-operator">{{ log.operator_name }} ({{ log.operator_role === 'warehouse' ? '仓库员' : '采摘向导' }})</div>
          </div>
        </div>
      </div>
    </template>

    <div v-if="showConfirmDialog" class="dialog-overlay" @click.self="showConfirmDialog = false">
      <div class="dialog">
        <h3>确认分级</h3>
        <p class="text-sm text-gray mb-4">确认后系统将自动更新对应果品的库存，此操作不可撤销。</p>
        <div class="form-group">
          <label class="form-label">确认备注（可选）</label>
          <textarea v-model="confirmNotes" class="form-textarea" placeholder="记录确认时的补充说明"></textarea>
        </div>
        <div class="flex gap-2 justify-between">
          <button class="btn btn-ghost" @click="showConfirmDialog = false">取消</button>
          <button class="btn btn-primary" @click="handleConfirm" :disabled="confirming">
            {{ confirming ? '确认中...' : '确认分级' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.batch-detail-grid {
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

.grade-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.grade-item {
  border: 1px solid var(--gray-200);
  border-radius: 8px;
  overflow: hidden;
}

.grade-header {
  padding: 8px 12px;
  font-size: 13px;
}

.grade-a .grade-header, .grade-header.grade-a { background: #e8f5e9; color: #2e7d32; }
.grade-b .grade-header, .grade-header.grade-b { background: #fff3e0; color: #e65100; }
.grade-c .grade-header, .grade-header.grade-c { background: #fff8e1; color: #f57f17; }
.grade-d .grade-header, .grade-header.grade-d { background: #fce4ec; color: #c62828; }

.grade-label {
  font-weight: 600;
}

.grade-desc {
  display: block;
  font-size: 11px;
  opacity: 0.8;
  margin-top: 2px;
}

.grade-input {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
}

.grade-input .form-input {
  width: 100px;
}

.grade-unit {
  font-size: 13px;
  color: var(--gray-500);
}

.grade-value {
  padding: 8px 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--gray-800);
}

.grade-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--gray-50);
  border-radius: 6px;
  font-size: 14px;
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
  width: 440px;
  max-width: 90vw;
  box-shadow: var(--shadow-lg);
}

.dialog h3 {
  font-size: 18px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .batch-detail-grid { grid-template-columns: repeat(2, 1fr); }
  .grade-grid { grid-template-columns: 1fr; }
}
</style>
