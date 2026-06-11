<template>
  <div class="page-container">
    <div class="page-header">
      <h2 class="page-title">工作台</h2>
      <div>
        <span style="color: #909399; margin-right: 10px;">欢迎回来，</span>
        <el-tag :type="roleTagType" size="large">{{ userInfo?.name }}</el-tag>
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card">
          <el-icon :size="32" color="#409eff"><Discount /></el-icon>
          <div class="stat-card-number" style="color: #409eff">{{ discountStats.total || 0 }}</div>
          <div class="stat-card-label">折扣活动总数</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <el-icon :size="32" color="#e6a23c"><Clock /></el-icon>
          <div class="stat-card-number" style="color: #e6a23c">{{ pendingCount }}</div>
          <div class="stat-card-label">待处理</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <el-icon :size="32" color="#f56c6c"><Warning /></el-icon>
          <div class="stat-card-number" style="color: #f56c6c">{{ exceptionCount }}</div>
          <div class="stat-card-label">异常项</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card">
          <el-icon :size="32" color="#67c23a"><Money /></el-icon>
          <div class="stat-card-number" style="color: #67c23a">{{ priceStats.total || 0 }}</div>
          <div class="stat-card-label">价格报备总数</div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-section">
          <div class="section-title">
            折扣活动状态分布
          </div>
          <el-row>
            <el-col :span="8" v-for="(item, key) in discountStatusList" :key="key">
              <div class="status-stat-item">
                <span :class="['status-tag', item.class]">{{ item.label }}</span>
                <span class="status-count">{{ discountStats[key] || 0 }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-section">
          <div class="section-title">
            价格报备状态分布
          </div>
          <el-row>
            <el-col :span="8" v-for="(item, key) in priceStatusList" :key="key">
              <div class="status-stat-item">
                <span :class="['status-tag', item.class]">{{ item.label }}</span>
                <span class="status-count">{{ priceStats[key] || 0 }}</span>
              </div>
            </el-col>
          </el-row>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="card-section">
          <div class="section-title" style="display: flex; justify-content: space-between;">
            <span>待我处理的活动</span>
            <el-button type="primary" text @click="$router.push('/discount')">查看全部</el-button>
          </div>
          <el-table :data="pendingDiscounts" style="width: 100%">
            <el-table-column prop="campaign_no" label="活动编号" width="140" />
            <el-table-column prop="title" label="活动名称" show-overflow-tooltip />
            <el-table-column prop="brand_name" label="品牌" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <span :class="['status-tag', DISCOUNT_STATUS[row.status]?.class]">
                  {{ DISCOUNT_STATUS[row.status]?.label }}
                </span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button type="primary" link @click="$router.push(`/discount/${row.id}`)">查看</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingDiscounts.length === 0" description="暂无待处理数据" />
        </div>
      </el-col>
      <el-col :span="12">
        <div class="card-section">
          <div class="section-title" style="display: flex; justify-content: space-between;">
            <span>最近操作日志</span>
            <el-button type="primary" text v-if="!isStoreManager" @click="$router.push('/logs')">查看全部</el-button>
          </div>
          <el-table :data="recentLogs" style="width: 100%">
            <el-table-column label="操作" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ getOperationLabel(row.operation) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="detail" label="内容" show-overflow-tooltip />
            <el-table-column label="时间" width="160">
              <template #default="{ row }">
                {{ formatTime(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="recentLogs.length === 0" description="暂无操作记录" />
        </div>
      </el-col>
    </el-row>

    <div class="card-section" v-if="exceptionCount > 0">
      <div class="section-title" style="color: #f56c6c;">
        <el-icon><Warning /></el-icon>
        <span style="margin-left: 8px;">异常提醒（{{ exceptionCount }} 项待处理）</span>
        <el-button type="danger" text style="margin-left: auto" @click="$router.push('/exception')">立即处理</el-button>
      </div>
      <el-alert
        v-for="(item, index) in exceptionItems"
        :key="index"
        :title="`${item.type}: ${item.title}`"
        :type="item.exceptionReason ? 'error' : 'warning'"
        :description="item.exceptionReason || '点击查看详情并处理'"
        show-icon
        closable
      />
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { discountApi, priceReportApi, logApi } from '@/api'
import { DISCOUNT_STATUS, PRICE_REPORT_STATUS, ROLE_LABELS } from '@/utils/constants'
import dayjs from 'dayjs'

const userStore = useUserStore()
const userInfo = computed(() => userStore.userInfo)
const isStoreManager = computed(() => userStore.isStoreManager)

const discountStats = reactive({})
const priceStats = reactive({})
const pendingDiscounts = ref([])
const recentLogs = ref([])
const exceptionItems = ref([])

const roleTagType = computed(() => {
  switch (userStore.userRole) {
    case 'store_manager': return 'warning'
    case 'operation_supervisor': return 'primary'
    case 'investment_manager': return 'success'
    default: return 'info'
  }
})

const discountStatusList = {
  pending_review: DISCOUNT_STATUS.pending_review,
  reviewing: DISCOUNT_STATUS.reviewing,
  exception: DISCOUNT_STATUS.exception
}

const priceStatusList = {
  reported: PRICE_REPORT_STATUS.reported,
  exception: PRICE_REPORT_STATUS.exception,
  rejected: PRICE_REPORT_STATUS.rejected
}

const pendingCount = computed(() => {
  if (isStoreManager.value) {
    return (discountStats.draft || 0) + (discountStats.rejected || 0) + (priceStats.pending || 0)
  } else if (userStore.isSupervisor) {
    return (discountStats.pending_review || 0) + (discountStats.reviewing || 0) + (priceStats.reported || 0)
  } else {
    return (discountStats.pending_review || 0) + (priceStats.reported || 0)
  }
})

const exceptionCount = computed(() => {
  return (discountStats.exception || 0) + (priceStats.exception || 0)
})

function formatTime(time) {
  return dayjs(time).format('YYYY-MM-DD HH:mm')
}

function getOperationLabel(op) {
  const labels = {
    create: '创建',
    submit: '提交',
    update: '更新',
    start_review: '开始审核',
    review_approve: '审核通过',
    review_reject: '审核退回',
    review_raise_exception: '标记异常',
    approve: '审批通过',
    reject: '退回',
    verify: '核实',
    raise_exception: '标记异常',
    resolve_exception: '解决异常',
    login: '登录',
    logout: '登出'
  }
  return labels[op] || op
}

async function loadStatistics() {
  try {
    const [dRes, pRes] = await Promise.all([
      discountApi.getStatistics(),
      priceReportApi.getStatistics()
    ])
    Object.assign(discountStats, dRes)
    Object.assign(priceStats, pRes)
  } catch (e) {
    console.error('Load statistics error:', e)
  }
}

async function loadPendingDiscounts() {
  try {
    let status
    if (isStoreManager.value) {
      status = 'draft'
    } else if (userStore.isSupervisor) {
      status = 'pending_review'
    } else {
      status = 'pending_review'
    }
    const res = await discountApi.getList({ status, page: 1, per_page: 5 })
    pendingDiscounts.value = res.items
  } catch (e) {
    console.error('Load pending discounts error:', e)
  }
}

async function loadRecentLogs() {
  try {
    const res = await logApi.getMyLogs({ page: 1, per_page: 5 })
    recentLogs.value = res.items
  } catch (e) {
    console.error('Load recent logs error:', e)
  }
}

async function loadExceptions() {
  try {
    const [dRes, pRes] = await Promise.all([
      discountApi.getList({ status: 'exception', page: 1, per_page: 3 }),
      priceReportApi.getList({ status: 'exception', page: 1, per_page: 3 })
    ])
    const items = []
    dRes.items.forEach(i => items.push({ type: '折扣活动', title: i.title, exceptionReason: i.exception_reason }))
    pRes.items.forEach(i => items.push({ type: '价格报备', title: i.product_name, exceptionReason: i.exception_reason }))
    exceptionItems.value = items.slice(0, 3)
  } catch (e) {
    console.error('Load exceptions error:', e)
  }
}

onMounted(() => {
  loadStatistics()
  loadPendingDiscounts()
  loadRecentLogs()
  loadExceptions()
})
</script>

<style scoped>
.stats-row {
  margin-bottom: 20px;
}

.status-stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px 0;
}

.status-count {
  font-size: 24px;
  font-weight: 700;
  color: #303133;
}

:deep(.el-alert) {
  margin-bottom: 12px;
}

:deep(.el-alert:last-child) {
  margin-bottom: 0;
}
</style>
