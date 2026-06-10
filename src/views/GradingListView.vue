<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { gradingApi } from '../api/resources'
import { STATUS_LABELS } from '../types'
import type { GradingRecord, PendingBatch } from '../types'

const router = useRouter()
const activeTab = ref<'pending' | 'done'>('pending')
const pendingBatches = ref<PendingBatch[]>([])
const gradingRecords = ref<GradingRecord[]>([])
const loading = ref(true)

onMounted(async () => {
  await Promise.all([loadPending(), loadRecords()])
  loading.value = false
})

async function loadPending() {
  try {
    const res = await gradingApi.getPendingBatches()
    pendingBatches.value = res.data
  } catch {}
}

async function loadRecords() {
  try {
    const res = await gradingApi.list({ status: 'confirmed' })
    gradingRecords.value = res.data
  } catch {}
}

function startGrading(batchId: number) {
  router.push({ name: 'grading-new', params: { batchId } })
}

function viewGrading(gradingId: number) {
  router.push({ name: 'grading-detail', params: { id: gradingId } })
}

function viewBatch(batchId: number) {
  router.push({ name: 'batch-detail', params: { id: batchId } })
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <h1 class="page-title">🏷️ 果品分级</h1>
    </div>

    <div class="tabs">
      <button class="tab" :class="{ active: activeTab === 'pending' }" @click="activeTab = 'pending'">
        待分级 ({{ pendingBatches.length }})
      </button>
      <button class="tab" :class="{ active: activeTab === 'done' }" @click="activeTab = 'done'">
        已完成分级 ({{ gradingRecords.length }})
      </button>
    </div>

    <div v-if="loading" class="loading">加载中...</div>

    <template v-else-if="activeTab === 'pending'">
      <div v-if="pendingBatches.length === 0" class="card">
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <p>所有批次已分级完成</p>
        </div>
      </div>
      <div v-for="batch in pendingBatches" :key="batch.id" class="card batch-card">
        <div class="batch-card-header">
          <div>
            <span class="batch-no">{{ batch.batch_no }}</span>
            <span class="badge" :class="batch.status === 'picked' ? 'badge-gray' : 'badge-info'">
              {{ STATUS_LABELS[batch.status] }}
            </span>
          </div>
          <div class="flex gap-2">
            <button class="btn btn-ghost btn-sm" @click="viewBatch(batch.id)">批次详情</button>
            <button
              v-if="batch.has_grading"
              class="btn btn-primary btn-sm"
              @click="viewGrading(batch.grading_id!)"
            >
              继续分级
            </button>
            <button
              v-else
              class="btn btn-primary btn-sm"
              @click="startGrading(batch.id)"
            >
              开始分级
            </button>
          </div>
        </div>
        <div class="batch-card-body">
          <div class="batch-info-grid">
            <div><span class="text-gray text-sm">果品</span><br>{{ batch.fruit_type }}</div>
            <div><span class="text-gray text-sm">采摘日期</span><br>{{ batch.picking_date }}</div>
            <div><span class="text-gray text-sm">采摘区</span><br>{{ batch.picking_area }}</div>
            <div><span class="text-gray text-sm">采摘量</span><br>{{ batch.quantity_picked }}{{ batch.unit }}</div>
            <div><span class="text-gray text-sm">向导</span><br>{{ batch.guide_name }}</div>
          </div>
        </div>
      </div>
    </template>

    <template v-else>
      <div v-if="gradingRecords.length === 0" class="card">
        <div class="empty-state">
          <div class="empty-state-icon">📋</div>
          <p>暂无已完成的分级记录</p>
        </div>
      </div>
      <div class="card">
        <table class="data-table">
          <thead>
            <tr>
              <th>批次号</th>
              <th>果品</th>
              <th>A级</th>
              <th>B级</th>
              <th>C级</th>
              <th>D级</th>
              <th>分级员</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="record in gradingRecords" :key="record.id">
              <td>{{ record.batch?.batch_no || `批次#${record.batch_id}` }}</td>
              <td>{{ record.batch?.fruit_type || '-' }}</td>
              <td>{{ record.grade_a_qty }}斤</td>
              <td>{{ record.grade_b_qty }}斤</td>
              <td>{{ record.grade_c_qty }}斤</td>
              <td>{{ record.grade_d_qty }}斤</td>
              <td>{{ record.grader_name }}</td>
              <td>
                <button class="btn btn-outline btn-sm" @click="viewGrading(record.id)">查看详情</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>
  </div>
</template>

<style scoped>
.batch-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.batch-no {
  font-weight: 700;
  font-size: 15px;
  margin-right: 8px;
}

.batch-card-body {
  background: var(--gray-50);
  border-radius: 6px;
  padding: 12px 16px;
}

.batch-info-grid {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .batch-info-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
