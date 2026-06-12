<template>
  <div class="page-container">
    <div class="dispute-highlight">
      <div class="alert-header">
        <el-icon size="20" color="#f56c6c"><Warning /></el-icon>
        <strong>最容易扯皮的三大问题</strong>
      </div>
      <div class="alert-grid">
        <div class="alert-item">
          <el-icon size="18" color="#e6a23c"><Clock /></el-icon>
          <div>
            <div class="alert-title">房源状态更新慢</div>
            <div class="alert-desc">共 {{ overview?.summary?.propertiesWithStaleStatus || 0 }} 套房源状态滞后</div>
          </div>
        </div>
        <div class="alert-item">
          <el-icon size="18" color="#e6a23c"><ChatDotRound /></el-icon>
          <div>
            <div class="alert-title">看房反馈散落各处</div>
            <div class="alert-desc">共 {{ overview?.summary?.viewingsWithoutFeedback || 0 }} 条看房记录无反馈</div>
          </div>
        </div>
        <div class="alert-item">
          <el-icon size="18" color="#f56c6c"><Wallet /></el-icon>
          <div>
            <div class="alert-title">押金结算争议</div>
            <div class="alert-desc">共 {{ overview?.summary?.depositDisputes || 0 }} 笔押金有争议待处理</div>
          </div>
        </div>
      </div>
    </div>

    <el-row :gutter="20">
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #ecf5ff">
            <el-icon :size="28" color="#409eff"><DocumentChecked /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ dashboard?.myActions?.pendingHandovers || 0 }}</div>
            <div class="stat-label">待处理交房验收</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #fef0f0">
            <el-icon :size="28" color="#f56c6c"><Warning /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overview?.summary?.totalDisputes || 0 }}</div>
            <div class="stat-label">总争议数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #fdf6ec">
            <el-icon :size="28" color="#e6a23c"><Key /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ overview?.summary?.pendingKeyTransfers || 0 }}</div>
            <div class="stat-label">钥匙待接收</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12" :lg="6">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #f0f9eb">
            <el-icon :size="28" color="#67c23a"><Bell /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ dashboard?.alerts?.length || 0 }}</div>
            <div class="stat-label">我的待办提醒</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :lg="14">
        <div class="section-card">
          <div class="section-title">🎯 {{ roleLabel }}的待办事项</div>
          <el-empty v-if="!dashboard?.alerts?.length" description="暂无待办" />
          <div v-else>
            <div
              v-for="(alert, idx) in dashboard.alerts"
              :key="idx"
              class="todo-item"
              :class="`priority-${alert.priority}`"
            >
              <div class="todo-left">
                <el-tag :type="priorityTagType(alert.priority)" size="small">
                  {{ priorityLabel(alert.priority) }}
                </el-tag>
                <span class="todo-text">{{ alert.message }}</span>
              </div>
              <div class="todo-right">
                <el-button
                  size="small"
                  type="primary"
                  link
                  @click="handleTodoAction(alert)"
                >
                  处理
                  <el-icon><ArrowRight /></el-icon>
                </el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :lg="10">
        <div class="section-card">
          <div class="section-title">📋 交付流转状态</div>
          <div class="flow-section">
            <div class="flow-title">交房验收流转</div>
            <el-steps finish-status="success" align-center :space="'100%'" size="small">
              <el-step title="提交" :description="(overview?.handoverFlow?.pendingCount || 0) + ' 待确认'" />
              <el-step title="确认" :description="(overview?.handoverFlow?.confirmedCount || 0) + ' 通过'" />
              <el-step title="争议" :status="(overview?.handoverFlow?.disputedCount || 0) > 0 ? 'error' : 'success'" :description="(overview?.handoverFlow?.disputedCount || 0) + ' 异议'" />
              <el-step title="解决" :description="(overview?.handoverFlow?.resolvedCount || 0) + ' 完成'" />
            </el-steps>
          </div>
          <div class="flow-section" style="margin-top: 24px">
            <div class="flow-title">押金结算流转</div>
            <el-steps finish-status="success" align-center :space="'100%'" size="small">
              <el-step title="发起" :description="(overview?.depositFlow?.pendingCount || 0) + ' 待确认'" />
              <el-step title="确认" :description="(overview?.depositFlow?.confirmedCount || 0) + ' 通过'" />
              <el-step title="争议" :status="(overview?.depositFlow?.disputedCount || 0) > 0 ? 'error' : 'success'" :description="(overview?.depositFlow?.disputedCount || 0) + ' 异议'" />
              <el-step title="结算" :description="(overview?.depositFlow?.settledCount || 0) + ' 完成'" />
            </el-steps>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="12">
        <div class="section-card">
          <div class="section-title" style="border-left-color: #f56c6c">
            🚨 交房验收争议（运营需处理）
          </div>
          <el-empty v-if="!overview?.handoverDisputes?.length" description="暂无争议" />
          <div v-else>
            <div
              v-for="d in overview.handoverDisputes"
              :key="d.id"
              class="dispute-card"
            >
              <div class="dispute-header">
                <span class="dispute-prop">{{ getPropertyName(d.propertyId) }}</span>
                <el-tag type="danger" size="small">争议中</el-tag>
              </div>
              <div class="dispute-body">
                <p><strong>提出方：</strong>{{ d.raisedBy }}</p>
                <p><strong>争议原因：</strong>{{ d.disputeReason }}</p>
                <p><strong>争议项：</strong>{{ d.disputedItems?.join('、') }}</p>
              </div>
              <div class="dispute-footer">
                <span class="dispute-time">{{ formatTime(d.raisedAt) }}</span>
                <el-button size="small" type="primary" @click="goHandover(d.id)">去处理</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :xs="24" :md="12">
        <div class="section-card">
          <div class="section-title" style="border-left-color: #e6a23c">
            💰 押金结算争议（财务需处理）
          </div>
          <el-empty v-if="!overview?.depositDisputes?.length" description="暂无争议" />
          <div v-else>
            <div
              v-for="d in overview.depositDisputes"
              :key="d.id"
              class="dispute-card"
            >
              <div class="dispute-header">
                <span class="dispute-prop">{{ d.tenantName }}</span>
                <el-tag type="danger" size="small">争议金额 ¥{{ d.disputedAmount }}</el-tag>
              </div>
              <div class="dispute-body">
                <p><strong>原始押金：</strong>¥{{ d.originalDeposit }}，应退：¥{{ d.refundAmount }}</p>
                <p><strong>提出方：</strong>{{ d.raisedBy }}</p>
                <p><strong>争议原因：</strong>{{ d.disputeReason }}</p>
              </div>
              <div class="dispute-footer">
                <span class="dispute-time">{{ formatTime(d.raisedAt) }}</span>
                <el-button size="small" type="primary" @click="goDeposit(d.id)">去处理</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :xs="24" :md="12">
        <div class="section-card">
          <div class="section-title" style="border-left-color: #909399">
            ⚠️ 房源状态滞后（运营注意）
          </div>
          <el-empty v-if="!overview?.staleProperties?.length" description="状态正常" />
          <el-table v-else :data="overview.staleProperties" size="small" stripe>
            <el-table-column label="房源" width="180">
              <template #default="{ row }">
                {{ row.building }} {{ row.floor }}层{{ row.unit }}
              </template>
            </el-table-column>
            <el-table-column prop="status" label="当前状态" width="120">
              <template #default="{ row }">
                <el-tag size="small">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="staleReason" label="滞后原因" />
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" link type="primary" @click="goProperty(row.id)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>

      <el-col :xs="24" :md="12">
        <div class="section-card">
          <div class="section-title" style="border-left-color: #909399">
            📭 看房记录无反馈（顾问注意）
          </div>
          <el-empty v-if="!overview?.viewingsWithoutFeedback?.length" description="反馈完整" />
          <el-table v-else :data="overview.viewingsWithoutFeedback" size="small" stripe>
            <el-table-column prop="viewerName" label="客户" width="100" />
            <el-table-column prop="viewerCompany" label="公司" width="140" />
            <el-table-column prop="consultantName" label="顾问" width="80" />
            <el-table-column prop="daysSinceView" label="已过天数" width="90">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.daysSinceView }} 天</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-button size="small" link type="primary" @click="goViewing(row.id)">补反馈</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { overviewApi, propertyApi } from '@/api'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const overview = ref(null)
const dashboard = ref(null)
const propertyMap = ref({})

const roleLabel = computed(() => {
  const map = { consultant: '租赁顾问', operations: '运营经理', finance: '财务' }
  return map[authStore.userRole] || authStore.userRole
})

function priorityTagType(p) {
  return { high: 'danger', warning: 'warning', info: 'info' }[p] || ''
}
function priorityLabel(p) {
  return { high: '高优', warning: '中等', info: '提示' }[p] || p
}

function statusLabel(s) {
  const m = {
    available: '可租', viewing: '带看中', leased: '已签约',
    handover_pending: '待交房', handover_accepted: '已验收',
    occupied: '已入驻', returning: '退租中'
  }
  return m[s] || s
}

async function loadData() {
  const [o, d, props] = await Promise.all([
    overviewApi.getDisputeOverview(),
    overviewApi.getRoleDashboard(),
    propertyApi.findAll()
  ])
  overview.value = o
  dashboard.value = d
  props.forEach(p => { propertyMap.value[p.id] = p })
}

function getPropertyName(id) {
  const p = propertyMap.value[id]
  return p ? `${p.building} ${p.floor}层${p.unit}` : id
}

function formatTime(t) {
  return t ? new Date(t).toLocaleString('zh-CN') : ''
}

function handleTodoAction(alert) {
  if (alert.type === 'viewing_no_feedback') goViewing(alert.data?.id)
  else if (alert.type === 'key_transfer_pending') router.push('/key-transfers')
  else if (alert.type === 'handover_dispute') goHandover(alert.data?.id)
  else if (alert.type === 'stale_status') goProperty(alert.data?.id)
  else if (alert.type === 'deposit_dispute') goDeposit(alert.data?.id)
}
function goHandover(id) { router.push({ path: '/borrow', query: { id } }) }
function goDeposit(id) { router.push({ path: '/deposits', query: { id } }) }
function goProperty(id) { router.push({ path: '/properties', query: { id } }) }
function goViewing(id) { router.push({ path: '/viewings', query: { id } }) }

onMounted(loadData)
</script>

<style scoped>
.alert-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  color: #f56c6c;
  margin-bottom: 14px;
}
.alert-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
}
.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  background: #fff;
  border-radius: 6px;
}
.alert-title {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
}
.alert-desc {
  font-size: 12px;
  color: #909399;
  margin-top: 2px;
}

.stat-card {
  border-radius: 10px;
  border: none;
}
.stat-card :deep(.el-card__body) {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
}
.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.stat-value {
  font-size: 26px;
  font-weight: 700;
  color: #303133;
}
.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 2px;
}

.todo-item {
  padding: 14px 16px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  background: #fafbfc;
  border: 1px solid #ebeef5;
}
.todo-item.priority-high { background: #fef0f0; border-color: #fbc4c4; }
.todo-item.priority-warning { background: #fdf6ec; border-color: #f5dab1; }
.todo-left { display: flex; align-items: center; gap: 12px; }
.todo-text { font-size: 14px; color: #303133; }

.flow-section { padding: 10px 0; }
.flow-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 16px;
  font-weight: 500;
}

.dispute-card {
  padding: 14px;
  border: 1px solid #fbc4c4;
  background: #fef0f0;
  border-radius: 8px;
  margin-bottom: 10px;
}
.dispute-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.dispute-prop { font-weight: 600; color: #303133; }
.dispute-body p {
  font-size: 13px;
  color: #606266;
  line-height: 1.8;
  margin: 0;
}
.dispute-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 10px;
}
.dispute-time {
  font-size: 12px;
  color: #909399;
}
</style>
