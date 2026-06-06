<template>
  <div class="dashboard">
    <el-row :gutter="20" class="stats-row">
      <el-col :span="4" v-for="stat in statsList" :key="stat.label">
        <div class="stat-card" :style="{ borderTopColor: stat.color }">
          <div class="stat-icon" :style="{ backgroundColor: stat.color + '15', color: stat.color }">
            <el-icon :size="24"><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ loading ? '--' : stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="quick-action-row">
      <el-col :span="24">
        <h3 class="section-title">快捷处理</h3>
      </el-col>
      <el-col :span="quickActionColSpan" v-for="action in quickActions" :key="action.title">
        <div class="quick-action-card" @click="handleQuickAction(action)">
          <div class="action-icon" :style="{ backgroundColor: action.color + '15', color: action.color }">
            <el-icon :size="28"><component :is="action.icon" /></el-icon>
          </div>
          <div class="action-content">
            <div class="action-count" v-if="action.showCount">
              {{ loading ? '--' : action.count }}
            </div>
            <div class="action-count-label" v-else>
              {{ action.countLabel }}
            </div>
            <div class="action-title">{{ action.title }}</div>
            <div class="action-desc">{{ action.description }}</div>
          </div>
          <div class="action-arrow">
            <el-icon :size="18"><ArrowRight /></el-icon>
          </div>
        </div>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="content-row">
      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>风险预警</h3>
            <el-tag type="danger" v-if="risks.length > 0">{{ risks.length }} 项待处理</el-tag>
          </div>
          <div class="card-body">
            <el-empty v-if="!loading && risks.length === 0" description="暂无风险项" :image-size="80" />
            <div v-else class="risk-list" v-loading="loading">
              <div v-for="risk in risks" :key="risk.key_id" class="risk-item">
                <div class="risk-level" :class="risk.level">
                  <el-icon v-if="risk.level === 'high'"><WarningFilled /></el-icon>
                  <el-icon v-else-if="risk.level === 'medium'"><InfoFilled /></el-icon>
                  <el-icon v-else><CircleCheck /></el-icon>
                </div>
                <div class="risk-content">
                  <div class="risk-title">
                    <span class="risk-key">{{ risk.key_number }}</span>
                    <span class="risk-type">{{ risk.risk_type === 'overdue' ? '逾期未还' : '挂失中' }}</span>
                  </div>
                  <div class="risk-desc">{{ risk.description }}</div>
                  <div class="risk-location">{{ risk.building }} {{ risk.room }}</div>
                </div>
                <el-button type="primary" link @click="goToKeyDetail(risk.key_id)">查看</el-button>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <el-col :span="12">
        <div class="card">
          <div class="card-header">
            <h3>最近变更</h3>
            <el-button type="primary" link @click="loadLogs" :loading="logsLoading">刷新</el-button>
          </div>
          <div class="card-body">
            <el-empty v-if="!logsLoading && logs.length === 0" description="暂无操作记录" :image-size="80" />
            <el-timeline v-else v-loading="logsLoading">
              <el-timeline-item
                v-for="log in logs"
                :key="log.id"
                :timestamp="formatTime(log.created_at)"
                :type="getLogType(log.action)"
                :color="getLogColor(log.action)"
              >
                <div class="log-item">
                  <div class="log-action">{{ getActionLabel(log.action) }}</div>
                  <div class="log-detail">{{ log.detail || '无详情' }}</div>
                  <div class="log-operator">
                    <el-tag size="small" :type="getOperatorRoleType(log.operator_role)">{{ log.operator_role }}</el-tag>
                    <span class="operator-name">{{ log.operator }}</span>
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
          </div>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { getDashboardStats, getRiskItems, getOperationLogs } from '@/api'
import type { DashboardStats, RiskItem, OperationLog } from '@/types'
import { useUserStore } from '@/stores/user'
import {
  Key,
  Check,
  Share,
  Warning,
  Clock,
  Tools,
  WarningFilled,
  InfoFilled,
  CircleCheck,
  ArrowRight,
  Switch,
  Refresh,
  View,
  Document,
  CirclePlus
} from '@element-plus/icons-vue'

const router = useRouter()
const userStore = useUserStore()

const loading = ref(true)
const logsLoading = ref(false)
const stats = ref<DashboardStats | null>(null)
const risks = ref<RiskItem[]>([])
const logs = ref<OperationLog[]>([])

interface QuickAction {
  title: string
  count: number
  countLabel: string
  showCount: boolean
  description: string
  icon: any
  color: string
  path: string
}

const statsList = computed(() => [
  {
    label: '总钥匙数',
    value: stats.value?.total_keys || 0,
    color: '#1e3a5f',
    icon: Key
  },
  {
    label: '在库',
    value: stats.value?.available_keys || 0,
    color: '#10b981',
    icon: Check
  },
  {
    label: '借出',
    value: stats.value?.borrowed_keys || 0,
    color: '#3b82f6',
    icon: Share
  },
  {
    label: '挂失',
    value: stats.value?.lost_keys || 0,
    color: '#ef4444',
    icon: Warning
  },
  {
    label: '逾期',
    value: stats.value?.overdue_borrows || 0,
    color: '#f59e0b',
    icon: Clock
  },
  {
    label: '待补配',
    value: stats.value?.lost_keys || 0,
    color: '#8b5cf6',
    icon: Tools
  }
])

const quickActions = computed<QuickAction[]>(() => {
  const role = userStore.user?.role
  const activeBorrows = stats.value?.active_borrows || stats.value?.borrowed_keys || 0
  const overdueBorrows = stats.value?.overdue_borrows || 0
  const lostKeys = stats.value?.lost_keys || 0

  if (role === 'dorm_manager') {
    return [
      {
        title: '借还处理',
        count: activeBorrows,
        countLabel: '',
        showCount: true,
        description: `${activeBorrows} 把钥匙借出未还，其中 ${overdueBorrows} 把已逾期`,
        icon: Switch,
        color: '#3b82f6',
        path: '/borrow'
      },
      {
        title: '挂失补配',
        count: lostKeys,
        countLabel: '',
        showCount: true,
        description: `${lostKeys} 把钥匙挂失中，需跟进补配`,
        icon: Warning,
        color: '#ef4444',
        path: '/lost'
      },
      {
        title: '数据重置',
        count: 0,
        countLabel: '系统操作',
        showCount: false,
        description: '恢复初始样例数据与风险记录',
        icon: Refresh,
        color: '#64748b',
        path: '/settings'
      }
    ]
  } else if (role === 'counselor') {
    return [
      {
        title: '风险宿舍',
        count: risks.value.length || overdueBorrows,
        countLabel: '',
        showCount: true,
        description: `${risks.value.length || overdueBorrows} 个宿舍存在钥匙逾期，需关注学生动向`,
        icon: View,
        color: '#f59e0b',
        path: '/keys'
      },
      {
        title: '挂失跟进',
        count: lostKeys,
        countLabel: '',
        showCount: true,
        description: `${lostKeys} 名学生钥匙挂失，需核实补配进度`,
        icon: Document,
        color: '#8b5cf6',
        path: '/lost'
      }
    ]
  } else if (role === 'maintenance') {
    return [
      {
        title: '待归还钥匙',
        count: activeBorrows,
        countLabel: '',
        showCount: true,
        description: `${activeBorrows} 把公共区域钥匙待归还`,
        icon: Check,
        color: '#10b981',
        path: '/borrow'
      },
      {
        title: '借用登记',
        count: 0,
        countLabel: '快速操作',
        showCount: false,
        description: '登记领取公共区域维修钥匙',
        icon: CirclePlus,
        color: '#3b82f6',
        path: '/borrow'
      }
    ]
  }
  return []
})

const quickActionColSpan = computed(() => {
  const count = quickActions.value.length
  if (count === 0) return 24
  if (count === 1) return 24
  if (count === 2) return 12
  return 8
})

const handleQuickAction = (action: QuickAction) => {
  router.push(action.path)
}

const formatTime = (time: string) => {
  const date = new Date(time)
  return date.toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    borrow: '借用钥匙',
    return: '归还钥匙',
    report_lost: '挂失钥匙',
    replace_key: '补配钥匙',
    create_key: '创建钥匙',
    update_key: '更新钥匙',
    delete_key: '删除钥匙'
  }
  return labels[action] || action
}

const getLogType = (action: string) => {
  if (action.includes('borrow') || action.includes('return')) return 'primary'
  if (action.includes('lost') || action.includes('replace')) return 'danger'
  if (action.includes('create')) return 'success'
  return 'info'
}

const getLogColor = (action: string) => {
  if (action.includes('borrow') || action.includes('return')) return '#3b82f6'
  if (action.includes('lost') || action.includes('replace')) return '#ef4444'
  if (action.includes('create')) return '#10b981'
  return '#64748b'
}

const getOperatorRoleType = (role: string) => {
  if (role === 'dorm_manager' || role === '宿管员') return 'primary'
  if (role === 'counselor' || role === '辅导员') return 'success'
  if (role === 'maintenance' || role === '维修人员') return 'warning'
  return 'info'
}

const goToKeyDetail = (keyId: number) => {
  router.push(`/keys/${keyId}`)
}

const loadData = async () => {
  loading.value = true
  try {
    const [statsData, risksData] = await Promise.all([
      getDashboardStats(),
      getRiskItems()
    ])
    stats.value = statsData
    risks.value = risksData
  } catch (e) {
    console.error('加载仪表盘数据失败', e)
    ElMessage.error('加载仪表盘数据失败')
  } finally {
    loading.value = false
  }
}

const loadLogs = async () => {
  logsLoading.value = true
  try {
    const logsData = await getOperationLogs({ limit: 10 })
    logs.value = logsData
  } catch (e) {
    console.error('加载操作日志失败', e)
    ElMessage.error('加载操作日志失败')
  } finally {
    logsLoading.value = false
  }
}

onMounted(() => {
  loadData()
  loadLogs()
})
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.stats-row {
  flex-shrink: 0;
}

.stat-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  border-top: 3px solid;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.stat-content {
  flex: 1;
  min-width: 0;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #64748b;
  margin-top: 4px;
}

.quick-action-row {
  flex-shrink: 0;
}

.section-title {
  margin: 0 0 12px 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.quick-action-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  display: flex;
  align-items: flex-start;
  gap: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  height: 100%;
}

.quick-action-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  transform: translateY(-2px);
}

.action-icon {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.action-content {
  flex: 1;
  min-width: 0;
}

.action-count {
  font-size: 32px;
  font-weight: 700;
  color: #1e293b;
  line-height: 1.2;
  margin-bottom: 4px;
}

.action-count-label {
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  line-height: 1.2;
  margin-bottom: 8px;
}

.action-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 4px;
}

.action-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.4;
}

.action-arrow {
  color: #94a3b8;
  flex-shrink: 0;
  margin-top: 4px;
}

.content-row {
  flex: 1;
  min-height: 0;
}

.card {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #f1f5f9;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.card-body {
  flex: 1;
  padding: 16px 20px;
  overflow-y: auto;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  transition: background 0.2s;
}

.risk-item:hover {
  background: #f1f5f9;
}

.risk-level {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.risk-level.high {
  background: #fef2f2;
  color: #ef4444;
}

.risk-level.medium {
  background: #fffbeb;
  color: #f59e0b;
}

.risk-level.low {
  background: #f0fdf4;
  color: #10b981;
}

.risk-content {
  flex: 1;
  min-width: 0;
}

.risk-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.risk-key {
  font-weight: 600;
  color: #1e293b;
  font-size: 14px;
}

.risk-type {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  background: #fee2e2;
  color: #dc2626;
}

.risk-desc {
  font-size: 13px;
  color: #475569;
  margin-bottom: 4px;
}

.risk-location {
  font-size: 12px;
  color: #94a3b8;
}

.log-item {
  padding: 4px 0;
}

.log-action {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
  margin-bottom: 4px;
}

.log-detail {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.log-operator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.operator-name {
  font-size: 12px;
  color: #94a3b8;
}
</style>
