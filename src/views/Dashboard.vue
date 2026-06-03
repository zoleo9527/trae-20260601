<template>
  <div class="dashboard-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">工作台</h1>
        <p class="page-subtitle">当前角色：{{ currentRole.name }} - {{ currentRole.description }}</p>
      </div>
    </div>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="4.8" v-for="stat in statsCards" :key="stat.key">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" :style="{ background: stat.color }">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-value">{{ stat.value }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <el-col :span="16">
        <el-card>
          <template #header>
            <div class="card-header-title">
              <el-icon><TrendCharts /></el-icon>
              待处理事项
            </div>
          </template>

          <div v-if="pendingOutbound.length > 0" class="section">
            <div class="section-title">
              <el-tag type="info">待出库验机</el-tag>
              <span>{{ pendingOutbound.length }}笔</span>
            </div>
            <div class="quick-list">
              <div
                v-for="item in pendingOutbound.slice(0, 3)"
                :key="item.id"
                class="quick-item card-hover"
                @click="goToOutboundInspect(item.id)"
              >
                <div class="quick-item-info">
                  <div class="equipment-name">{{ item.equipment.name }}</div>
                  <div class="order-no">{{ item.orderNo }} · {{ item.customer.name }}</div>
                </div>
                <el-button type="primary" size="small">去验机</el-button>
              </div>
            </div>
            <div v-if="pendingOutbound.length > 3" class="see-more">
              <el-button type="primary" text @click="router.push('/outbound/pending')">
                查看全部 {{ pendingOutbound.length }} 笔 →
              </el-button>
            </div>
          </div>

          <div v-if="pendingReturn.length > 0" class="section">
            <div class="section-title">
              <el-tag type="warning">待归还复核</el-tag>
              <span>{{ pendingReturn.length }}笔</span>
            </div>
            <div class="quick-list">
              <div
                v-for="item in pendingReturn.slice(0, 3)"
                :key="item.id"
                class="quick-item card-hover"
                @click="goToReturnReview(item.id)"
              >
                <div class="quick-item-info">
                  <div class="equipment-name">{{ item.equipment.name }}</div>
                  <div class="order-no">{{ item.orderNo }} · {{ item.customer.name }}</div>
                </div>
                <el-button type="warning" size="small">去复核</el-button>
              </div>
            </div>
            <div v-if="pendingReturn.length > 3" class="see-more">
              <el-button type="primary" text @click="router.push('/return/pending')">
                查看全部 {{ pendingReturn.length }} 笔 →
              </el-button>
            </div>
          </div>

          <div v-if="abnormalRentals.length > 0" class="section">
            <div class="section-title">
              <el-tag type="danger">异常待处理</el-tag>
              <span>{{ abnormalRentals.length }}笔</span>
            </div>
            <div class="quick-list">
              <div
                v-for="item in abnormalRentals"
                :key="item.id"
                class="quick-item card-hover anomaly"
                @click="goToHistoryDetail(item.id)"
              >
                <div class="quick-item-info">
                  <div class="equipment-name">
                    <el-icon color="#ef4444"><Warning /></el-icon>
                    {{ item.equipment.name }}
                  </div>
                  <div class="order-no">
                    {{ item.returnInspection?.anomalyReport?.pendingAction || '待处理' }}
                  </div>
                </div>
                <el-button type="danger" size="small">处理</el-button>
              </div>
            </div>
          </div>

          <div v-if="pendingOutbound.length === 0 && pendingReturn.length === 0 && abnormalRentals.length === 0" class="empty-state">
            <el-empty description="暂无待处理事项" />
          </div>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="integration-card">
          <template #header>
            <div class="card-header-title">
              <el-icon><Link /></el-icon>
              系统集成状态
            </div>
          </template>
          <div class="integration-list">
            <div
              v-for="point in integrationPoints"
              :key="point.id"
              class="integration-item"
            >
              <div class="integration-header">
                <span class="integration-name">{{ point.name }}</span>
                <el-tag size="small" type="info">待集成</el-tag>
              </div>
              <p class="integration-desc">{{ point.description }}</p>
              <div class="integration-point">
                <el-icon><InfoFilled /></el-icon>
                <span>模拟数据位置：{{ point.mockDataLocation }}</span>
              </div>
            </div>
          </div>
        </el-card>

        <el-card style="margin-top: 20px;">
          <template #header>
            <div class="card-header-title">
              <el-icon><UserFilled /></el-icon>
              角色切换
            </div>
          </template>
          <el-radio-group v-model="currentRoleKey" class="role-switcher">
            <el-radio-button value="frontline">一线操作员</el-radio-button>
            <el-radio-button value="manager">门店经理</el-radio-button>
            <el-radio-button value="admin">系统管理员</el-radio-button>
          </el-radio-group>
          <div class="role-permissions">
            <div class="permission-title">当前权限：</div>
            <el-tag
              v-for="perm in currentRole.permissions"
              :key="perm"
              size="small"
              style="margin-right: 6px; margin-bottom: 6px;"
            >
              {{ perm }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useEquipmentStore } from '@/stores/equipment'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const equipmentStore = useEquipmentStore()
const authStore = useAuthStore()

const currentRole = computed(() => authStore.currentRole)
const currentRoleKey = computed({
  get: () => authStore.currentRoleKey,
  set: (val) => authStore.switchRole(val)
})

const stats = computed(() => equipmentStore.stats)
const pendingOutbound = computed(() => equipmentStore.pendingOutbound)
const pendingReturn = computed(() => equipmentStore.pendingReturn)
const abnormalRentals = computed(() =>
  equipmentStore.allRentals.filter(r =>
    r.status === 'abnormal' || r.status === 'in_repair'
  )
)
const integrationPoints = computed(() => equipmentStore.integrationPoints)

const statsCards = computed(() => [
  {
    key: 'pendingOutbound',
    label: '待出库验机',
    value: stats.value.pendingOutboundCount,
    icon: 'Box',
    color: 'linear-gradient(135deg, #60a5fa, #3b82f6)'
  },
  {
    key: 'renting',
    label: '租赁中',
    value: stats.value.rentingCount,
    icon: 'Camera',
    color: 'linear-gradient(135deg, #34d399, #10b981)'
  },
  {
    key: 'pendingReturn',
    label: '待归还复核',
    value: stats.value.pendingReturnCount,
    icon: 'Refresh',
    color: 'linear-gradient(135deg, #fbbf24, #f59e0b)'
  },
  {
    key: 'abnormal',
    label: '异常待处理',
    value: stats.value.abnormalCount,
    icon: 'Warning',
    color: 'linear-gradient(135deg, #f87171, #ef4444)'
  },
  {
    key: 'todayCompleted',
    label: '今日完成',
    value: stats.value.todayCompleted,
    icon: 'Check',
    color: 'linear-gradient(135deg, #a78bfa, #8b5cf6)'
  }
])

const goToOutboundInspect = (id) => router.push(`/outbound/inspect/${id}`)
const goToReturnReview = (id) => router.push(`/return/review/${id}`)
const goToHistoryDetail = (id) => router.push(`/history/detail/${id}`)
</script>

<style scoped>
.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 28px;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #6b7280;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1f2937;
}

.card-header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
}

.section {
  margin-bottom: 24px;
}

.section:last-child {
  margin-bottom: 0;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
  font-size: 14px;
  color: #374151;
}

.quick-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.quick-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.quick-item.anomaly {
  background: #fef2f2;
  border-color: #fecaca;
}

.quick-item-info {
  flex: 1;
}

.quick-item-info .equipment-name {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.quick-item-info .order-no {
  font-size: 12px;
  color: #6b7280;
}

.see-more {
  margin-top: 10px;
  text-align: right;
}

.empty-state {
  padding: 40px 0;
}

.integration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.integration-item {
  padding: 12px;
  background: #f9fafb;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.integration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.integration-name {
  font-weight: 600;
  color: #374151;
  font-size: 13px;
}

.integration-desc {
  font-size: 12px;
  color: #6b7280;
  margin: 0 0 8px 0;
}

.integration-point {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #1e40af;
  font-family: monospace;
}

.role-switcher {
  margin-bottom: 16px;
}

.role-permissions {
  padding-top: 12px;
  border-top: 1px solid #f3f4f6;
}

.permission-title {
  font-size: 12px;
  color: #6b7280;
  margin-bottom: 8px;
}
</style>
