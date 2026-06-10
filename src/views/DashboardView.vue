<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { systemApi, reservationApi, complaintApi, batchApi, gradingApi } from '../api/resources'
import { STATUS_LABELS, ROLE_LABELS } from '../types'
import type { DashboardStats, Reservation, Complaint, FruitBatch, PendingBatch } from '../types'

const auth = useAuthStore()
const router = useRouter()
const stats = ref<DashboardStats | null>(null)
const recentReservations = ref<Reservation[]>([])
const overbookedReservations = ref<Reservation[]>([])
const recentComplaints = ref<Complaint[]>([])
const pendingComplaints = ref<Complaint[]>([])
const recentBatches = ref<FruitBatch[]>([])
const pendingGradingBatches = ref<PendingBatch[]>([])
const gradedBatches = ref<FruitBatch[]>([])
const resetting = ref(false)

onMounted(async () => {
  await Promise.all([
    loadStats(),
    loadRecentData(),
  ])
})

async function loadStats() {
  try {
    const res = await systemApi.getStats()
    stats.value = res.data
  } catch {}
}

async function loadRecentData() {
  try {
    const role = auth.currentUser?.role
    const tasks = [
      batchApi.list(),
      reservationApi.list(),
      complaintApi.list(),
    ]
    if (role === 'warehouse') {
      tasks.push(gradingApi.getPendingBatches())
      tasks.push(batchApi.list({ status: 'graded' }))
    }
    const [batchesRes, reservationsRes, complaintsRes, gradingRes, gradedRes] = await Promise.all(tasks as any)

    recentBatches.value = batchesRes.data.slice(0, 5)
    const allReservations = reservationsRes.data
    recentReservations.value = allReservations.filter((r: Reservation) => r.status === 'pending').slice(0, 5)
    overbookedReservations.value = allReservations.filter((r: Reservation) => r.overbook_flag === 1 && r.status !== 'completed')

    const allComplaints = complaintsRes.data
    recentComplaints.value = allComplaints.filter((c: Complaint) => c.status !== 'replied').slice(0, 5)
    pendingComplaints.value = allComplaints.filter((c: Complaint) => c.status === 'pending')

    if (gradingRes) pendingGradingBatches.value = gradingRes.data
    if (gradedRes) gradedBatches.value = gradedRes.data
  } catch {}
}

async function handleReset() {
  if (!confirm('确定要重置所有数据吗？将恢复为演示样例数据。')) return
  resetting.value = true
  try {
    await systemApi.resetData()
    await Promise.all([loadStats(), loadRecentData()])
  } catch {}
  resetting.value = false
}

function goToBatch(id: number) {
  router.push({ name: 'batch-detail', params: { id } })
}

function goToReservation(id: number) {
  router.push({ name: 'reservation-detail', params: { id } })
}

function goToComplaint(id: number) {
  router.push({ name: 'complaint-detail', params: { id } })
}

function goToGradingNew(batchId: number) {
  router.push({ name: 'grading-new', params: { batchId } })
}

function goToGradingDetail(gradingId: number) {
  router.push({ name: 'grading-detail', params: { id: gradingId } })
}

function goToInventory() {
  router.push({ name: 'inventory' })
}
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ auth.currentUser?.display_name }}的工作台</h1>
        <p class="text-sm text-gray mt-2">
          {{ ROLE_LABELS[auth.currentUser?.role || ''] }} · {{ new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' }) }}
        </p>
      </div>
      <button class="btn btn-outline btn-sm" @click="handleReset" :disabled="resetting">
        🔄 {{ resetting ? '重置中...' : '重置演示数据' }}
      </button>
    </div>

    <div v-if="auth.currentUser?.role === 'customer_service'" class="role-workspace">
      <div class="workflow-guide card">
        <div class="workflow-title">📋 今日处理流程</div>
        <div class="workflow-steps">
          <div class="workflow-step step-active">
            <span class="step-num">1</span>
            <span>超量预约 →</span>
          </div>
          <div class="workflow-step">
            <span class="step-num">2</span>
            <span>待回复投诉 →</span>
          </div>
          <div class="workflow-step">
            <span class="step-num">3</span>
            <span>常规预约确认</span>
          </div>
        </div>
      </div>

      <div v-if="overbookedReservations.length > 0" class="task-card task-danger">
        <div class="task-header">
          <div class="task-title">⚠️ 超量预约（立即处理）</div>
          <router-link :to="{ name: 'reservations' }" class="text-sm">全部 →</router-link>
        </div>
        <div v-for="r in overbookedReservations.slice(0,3)" :key="r.id" class="task-item" @click="goToReservation(r.id)">
          <div class="task-main">
            <span class="task-name">{{ r.visitor_name }}</span>
            <span class="badge badge-danger">超量预约</span>
          </div>
          <div class="task-desc">{{ r.reserved_date }} · {{ r.fruit_type }} · 预约{{ r.reserved_qty }}斤</div>
        </div>
      </div>

      <div v-if="pendingComplaints.length > 0" class="task-card task-warning">
        <div class="task-header">
          <div class="task-title">💬 待受理投诉（游客在等回复）</div>
          <router-link :to="{ name: 'complaints' }" class="text-sm">全部 →</router-link>
        </div>
        <div v-for="c in pendingComplaints.slice(0,3)" :key="c.id" class="task-item" @click="goToComplaint(c.id)">
          <div class="task-main">
            <span class="task-name">{{ c.visitor_name }}</span>
            <span class="badge badge-danger">待处理</span>
          </div>
          <div class="task-desc">{{ c.category }} · {{ c.content.substring(0,50) }}...</div>
        </div>
      </div>

      <div v-if="recentReservations.length > 0" class="task-card task-info">
        <div class="task-header">
          <div class="task-title">📅 待确认预约</div>
          <router-link :to="{ name: 'reservations' }" class="text-sm">全部 →</router-link>
        </div>
        <table class="data-table compact">
          <thead>
            <tr>
              <th>游客</th>
              <th>日期</th>
              <th>果品</th>
              <th>数量</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in recentReservations" :key="r.id" class="clickable-row" @click="goToReservation(r.id)">
              <td>{{ r.visitor_name }}</td>
              <td>{{ r.reserved_date }}</td>
              <td>{{ r.fruit_type }}</td>
              <td>{{ r.reserved_qty }}斤</td>
              <td><button class="btn btn-primary btn-sm" @click.stop="goToReservation(r.id)">去处理</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="recentComplaints.length > 0" class="card">
        <div class="card-header">
          <h3 class="card-title">📋 处理中投诉</h3>
          <router-link :to="{ name: 'complaints' }" class="text-sm">查看全部 →</router-link>
        </div>
        <div v-for="c in recentComplaints" :key="c.id" class="complaint-row" @click="goToComplaint(c.id)">
          <div class="complaint-main">
            <span class="task-name">{{ c.visitor_name }}</span>
            <span class="badge" :class="c.status === 'pending' ? 'badge-danger' : 'badge-warning'">{{ STATUS_LABELS[c.status] }}</span>
          </div>
          <div class="task-desc">{{ c.category }} · {{ c.content.substring(0,60) }}...</div>
        </div>
      </div>
    </div>

    <div v-else-if="auth.currentUser?.role === 'picking_guide'" class="role-workspace">
      <div class="workflow-guide card">
        <div class="workflow-title">🧺 今日处理流程</div>
        <div class="workflow-steps">
          <div class="workflow-step step-active">
            <span class="step-num">1</span>
            <span>提交今日采摘批次 →</span>
          </div>
          <div class="workflow-step">
            <span class="step-num">2</span>
            <span>上报采摘损耗 →</span>
          </div>
          <div class="workflow-step">
            <span class="step-num">3</span>
            <span>跟进分级入库状态</span>
          </div>
        </div>
      </div>

      <div class="quick-actions">
        <button class="btn btn-primary action-btn" @click="$router.push({ name: 'picking' })">
          <span class="action-icon">🧺</span>
          <div>
            <div class="action-title">提交采摘批次</div>
            <div class="action-desc">录入今日采摘的果品</div>
          </div>
        </button>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 我的采摘批次</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>批次号</th>
              <th>果品</th>
              <th>采摘日期</th>
              <th>数量</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in recentBatches" :key="b.id" class="clickable-row" @click="goToBatch(b.id)">
              <td class="font-bold">{{ b.batch_no }}</td>
              <td>{{ b.fruit_type }}</td>
              <td>{{ b.picking_date }}</td>
              <td>{{ b.quantity_picked }}{{ b.unit }}</td>
              <td>
                <span class="badge" :class="{
                  'badge-success': b.status === 'stored',
                  'badge-info': b.status === 'grading',
                  'badge-warning': b.status === 'graded',
                  'badge-gray': b.status === 'picked',
                }">{{ STATUS_LABELS[b.status] }}</span>
              </td>
              <td><button class="btn btn-outline btn-sm" @click.stop="goToBatch(b.id)">查看详情</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-else-if="auth.currentUser?.role === 'warehouse'" class="role-workspace">
      <div class="workflow-guide card">
        <div class="workflow-title">🏷️ 今日处理流程</div>
        <div class="workflow-steps">
          <div class="workflow-step step-active">
            <span class="step-num">1</span>
            <span>待分级批次 →</span>
          </div>
          <div class="workflow-step">
            <span class="step-num">2</span>
            <span>确认分级入库 →</span>
          </div>
          <div class="workflow-step">
            <span class="step-num">3</span>
            <span>确认入库完成</span>
          </div>
        </div>
      </div>

      <div v-if="pendingGradingBatches.length > 0" class="task-card task-primary">
        <div class="task-header">
          <div class="task-title">🏷️ 待分级批次</div>
          <router-link :to="{ name: 'grading' }" class="text-sm">全部 →</router-link>
        </div>
        <div v-for="batch in pendingGradingBatches.slice(0,4)" :key="batch.id" class="task-item" @click="batch.has_grading ? goToGradingDetail(batch.grading_id!) : goToGradingNew(batch.id)">
          <div class="task-main">
            <span class="task-name">{{ batch.batch_no }}</span>
            <span class="badge" :class="batch.status === 'picked' ? 'badge-gray' : 'badge-info'">{{ STATUS_LABELS[batch.status] }}</span>
          </div>
          <div class="task-desc">{{ batch.fruit_type }} · {{ batch.picking_area }} · {{ batch.quantity_picked }}{{ batch.unit }}</div>
          <button class="btn btn-primary btn-sm mt-2">{{ batch.has_grading ? '继续分级' : '开始分级' }}</button>
        </div>
      </div>

      <div v-if="gradedBatches.length > 0" class="task-card task-success">
        <div class="task-header">
          <div class="task-title">📦 待入库确认（已分级完成）</div>
          <router-link :to="{ name: 'inventory' }" class="text-sm">去库存管理 →</router-link>
        </div>
        <div v-for="b in gradedBatches.slice(0,3)" :key="b.id" class="task-item" @click="goToBatch(b.id)">
          <div class="task-main">
            <span class="task-name">{{ b.batch_no }}</span>
            <span class="badge badge-warning">已分级</span>
          </div>
          <div class="task-desc">{{ b.fruit_type }} · {{ b.quantity_picked }}{{ b.unit }}</div>
          <button class="btn btn-success btn-sm mt-2" @click.stop="goToInventory()">确认入库</button>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 库存总览</h3>
          <button class="btn btn-outline btn-sm" @click="goToInventory()">查看库存 →</button>
        </div>
        <div v-if="stats" class="grid-3">
          <div class="inv-stat">
            <div class="inv-icon">📦</div>
            <div class="inv-value">{{ stats.total_inventory_value.toFixed(0) }} 斤</div>
            <div class="inv-label">库存总量</div>
          </div>
          <div class="inv-stat">
            <div class="inv-icon">🏷️</div>
            <div class="inv-value">{{ stats.pending_grading }}</div>
            <div class="inv-label">待分级</div>
          </div>
          <div class="inv-stat">
            <div class="inv-icon">🚚</div>
            <div class="inv-value">{{ stats.pending_warehousing }}</div>
            <div class="inv-label">待入库</div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📋 最近批次</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>批次号</th>
              <th>果品</th>
              <th>采摘日期</th>
              <th>数量</th>
              <th>向导</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="b in recentBatches" :key="b.id" class="clickable-row" @click="goToBatch(b.id)">
              <td class="font-bold">{{ b.batch_no }}</td>
              <td>{{ b.fruit_type }}</td>
              <td>{{ b.picking_date }}</td>
              <td>{{ b.quantity_picked }}{{ b.unit }}</td>
              <td>{{ b.guide_name }}</td>
              <td>
                <span class="badge" :class="{
                  'badge-success': b.status === 'stored',
                  'badge-info': b.status === 'grading',
                  'badge-warning': b.status === 'graded',
                  'badge-gray': b.status === 'picked',
                }">{{ STATUS_LABELS[b.status] }}</span>
              </td>
            </tr>
          </tbody>
          </table>
      </div>
    </div>

    <div v-if="stats" class="mt-4">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📊 全局数据概览</h3>
        </div>
        <div class="grid-4">
          <div class="stat-card" v-if="auth.currentUser?.role === 'warehouse'">
            <div class="stat-icon">🏷️</div>
            <div class="stat-value">{{ stats.pending_grading }}</div>
            <div class="stat-label">待分级批次</div>
          </div>
          <div class="stat-card" v-if="auth.currentUser?.role === 'warehouse'">
            <div class="stat-icon">📦</div>
            <div class="stat-value">{{ stats.pending_warehousing }}</div>
            <div class="stat-label">待入库批次</div>
          </div>
          <div class="stat-card" v-if="auth.currentUser?.role === 'customer_service'">
            <div class="stat-icon">💬</div>
            <div class="stat-value">{{ stats.pending_complaints }}</div>
            <div class="stat-label">待处理投诉</div>
          </div>
          <div class="stat-card" v-if="auth.currentUser?.role === 'customer_service'">
            <div class="stat-icon">⚠️</div>
            <div class="stat-value">{{ stats.overbooked_reservations }}</div>
            <div class="stat-label">超量预约</div>
          </div>
          <div class="stat-card" v-if="auth.currentUser?.role === 'picking_guide'">
            <div class="stat-icon">🧺</div>
            <div class="stat-value">{{ stats.today_batches }}</div>
            <div class="stat-label">今日采摘批次</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ stats.total_inventory_value.toFixed(0) }}</div>
            <div class="stat-label">库存总量(斤)</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.role-workspace {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.workflow-guide {
  background: linear-gradient(135deg, #f1f8e9 0%, #e8f5e9 100%);
  border-left: 4px solid var(--primary);
}

.workflow-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--primary);
  margin-bottom: 12px;
}

.workflow-steps {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.workflow-step {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #fff;
  border-radius: 20px;
  font-size: 13px;
  color: var(--gray-600);
  font-weight: 500;
}

.step-num {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--gray-200);
  color: var(--gray-600);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
}

.step-active {
  background: var(--primary);
  color: #fff;
}

.step-active .step-num {
  background: #fff;
  color: var(--primary);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.task-card {
  border-radius: var(--radius);
  padding: 16px 20px;
  box-shadow: var(--shadow);
}

.task-danger {
  background: linear-gradient(135deg, #ffebee 0%, #ffcdd2 100%);
  border-left: 4px solid var(--danger);
}

.task-warning {
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
  border-left: 4px solid var(--warning);
}

.task-info {
  background: #fff;
  border: 1px solid var(--gray-200);
}

.task-primary {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 4px solid var(--primary);
}

.task-success {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 4px solid var(--success);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--gray-800);
}

.task-item {
  background: rgba(255,255,255,0.7);
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.task-item:hover {
  background: #fff;
  transform: translateX(4px);
}

.task-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.task-name {
  font-weight: 600;
  font-size: 14px;
  color: var(--gray-800);
}

.task-desc {
  font-size: 13px;
  color: var(--gray-600);
}

.quick-actions {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.action-btn {
  display: flex !important;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  text-align: left;
  height: auto;
  justify-content: flex-start;
  background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%);
  border: none;
}

.action-icon {
  font-size: 36px;
}

.action-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--gray-800);
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: var(--gray-600);
}

.complaint-row {
  padding: 12px;
  border-bottom: 1px solid var(--gray-100);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.complaint-row:hover {
  background: var(--gray-50);
}

.complaint-main {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.inv-stat {
  text-align: center;
  padding: 20px;
  background: var(--gray-50);
  border-radius: 8px;
}

.inv-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.inv-value {
  font-size: 28px;
  font-weight: 700;
  color: var(--gray-900);
}

.inv-label {
  font-size: 13px;
  color: var(--gray-500);
  margin-top: 4px;
}

.stat-card {
  background: #fff;
  border-radius: var(--radius);
  box-shadow: var(--shadow);
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--gray-900);
}

.stat-label {
  font-size: 13px;
  color: var(--gray-500);
  margin-top: 4px;
}

.data-table.compact th,
.data-table.compact td {
  padding: 8px 12px;
  font-size: 13px;
}

.mt-2 { margin-top: 8px;
}
.mt-4 { margin-top: 16px;
}

.grid-3 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

@media (max-width: 768px) {
  .grid-3, .grid-4 { grid-template-columns: repeat(2, 1fr); }
  .workflow-steps { flex-direction: column; }
}
</style>
