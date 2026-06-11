<template>
  <div class="page-container">
    <div class="dashboard-grid">
      <el-row :gutter="20">
        <el-col :span="6" v-for="card in statCards" :key="card.key">
          <el-card shadow="hover" class="stat-card" :class="'stat-' + card.key">
            <div class="stat-icon">
              <el-icon :size="32"><component :is="card.icon" /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ card.value }}</div>
              <div class="stat-label">{{ card.label }}</div>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="14">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">快捷操作</span>
            </template>
            <div class="quick-actions">
              <el-button
                v-for="action in quickActions"
                :key="action.key"
                :type="action.type"
                @click="$router.push(action.route)"
                size="large"
                class="action-btn"
              >
                <el-icon><component :is="action.icon" /></el-icon>
                {{ action.label }}
              </el-button>
            </div>
          </el-card>
        </el-col>

        <el-col :span="10">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">最近动态</span>
            </template>
            <HistoryTimeline :records="recentHistory" />
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">待处理事项</span>
            </template>
            <el-table :data="pendingItems" size="small" stripe>
              <el-table-column label="类型" width="100">
                <template #default="{ row }">
                  <el-tag :type="row.tagType" size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="名称" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                  <span class="status-text" :class="'status-' + row.statusKey">{{ row.status }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="$router.push(row.route)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>

        <el-col :span="12">
          <el-card shadow="hover">
            <template #header>
              <span class="card-title">证照到期提醒</span>
            </template>
            <el-table :data="expiringLicenses" size="small" stripe>
              <el-table-column prop="license_type" label="证照类型" />
              <el-table-column prop="tenant_name" label="租户" width="100" />
              <el-table-column prop="expire_date" label="到期日" width="120" />
              <el-table-column label="操作" width="80">
                <template #default="{ row }">
                  <el-button type="primary" link size="small" @click="$router.push('/licenses/' + row.id)">查看</el-button>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useTenantStore } from '@/stores/tenant'
import { useLicenseStore } from '@/stores/license'
import { useActivityStore } from '@/stores/activity'
import { useComplaintStore } from '@/stores/complaint'
import { getHistoryRecords } from '@/api/history'
import HistoryTimeline from '@/components/HistoryTimeline.vue'
import dayjs from 'dayjs'

const authStore = useAuthStore()
const tenantStore = useTenantStore()
const licenseStore = useLicenseStore()
const activityStore = useActivityStore()
const complaintStore = useComplaintStore()

const recentHistory = ref<any[]>([])

onMounted(async () => {
  await Promise.all([
    tenantStore.fetchTenants(),
    licenseStore.fetchLicenses(),
    activityStore.fetchActivities(),
    complaintStore.fetchComplaints(),
    loadHistory()
  ])
})

async function loadHistory() {
  try {
    recentHistory.value = await getHistoryRecords({ limit: 8 })
  } catch {}
}

const statCards = computed(() => {
  const pendingTenants = tenantStore.tenants.filter(t => t.status === 'pending').length
  const pendingLicenses = licenseStore.licenses.filter(l => l.status === 'pending' || l.status === 'need_reupload').length
  const pendingActivities = activityStore.activities.filter(a => a.status === 'pending').length
  const pendingComplaints = complaintStore.complaints.filter(c => c.status === 'pending' || c.status === 'processing').length

  if (authStore.isEngineering) {
    return [
      { key: 'complaints', label: '待处理投诉', value: pendingComplaints, icon: 'Warning' },
      { key: 'activities', label: '活动审批', value: pendingActivities, icon: 'Calendar' },
      { key: 'processing', label: '处理中', value: complaintStore.complaints.filter(c => c.status === 'processing').length, icon: 'Loading' },
      { key: 'resolved', label: '已完成', value: complaintStore.complaints.filter(c => c.status === 'resolved').length, icon: 'CircleCheck' }
    ]
  }

  if (authStore.isCustomerService) {
    return [
      { key: 'tenants', label: '租户总数', value: tenantStore.tenants.length, icon: 'Shop' },
      { key: 'pending', label: '待审租户', value: pendingTenants, icon: 'Clock' },
      { key: 'activities', label: '待审活动', value: pendingActivities, icon: 'Calendar' },
      { key: 'complaints', label: '待处理投诉', value: pendingComplaints, icon: 'Warning' }
    ]
  }

  return [
    { key: 'tenants', label: '租户总数', value: tenantStore.tenants.length, icon: 'Shop' },
    { key: 'pending', label: '待审入驻', value: pendingTenants, icon: 'Clock' },
    { key: 'licenses', label: '待审证照', value: pendingLicenses, icon: 'Document' },
    { key: 'complaints', label: '待处理投诉', value: pendingComplaints, icon: 'Warning' }
  ]
})

const quickActions = computed(() => {
  if (authStore.isEngineering) {
    return [
      { key: 'complaints', label: '投诉工单', icon: 'Warning', type: 'danger', route: '/complaints' },
      { key: 'activities', label: '活动审批', icon: 'Calendar', type: 'primary', route: '/activities' }
    ]
  }

  if (authStore.isCustomerService) {
    return [
      { key: 'tenants', label: '租户查询', icon: 'Search', type: 'primary', route: '/tenants' },
      { key: 'complaint-new', label: '登记投诉', icon: 'EditPen', type: 'warning', route: '/complaints' },
      { key: 'activities', label: '活动申请', icon: 'Calendar', type: 'success', route: '/activities' }
    ]
  }

  return [
    { key: 'tenant-new', label: '新增租户', icon: 'Plus', type: 'primary', route: '/tenants' },
    { key: 'license-new', label: '证照录入', icon: 'Document', type: 'success', route: '/licenses' },
    { key: 'activities', label: '活动管理', icon: 'Calendar', type: 'warning', route: '/activities' },
    { key: 'complaints', label: '投诉处理', icon: 'Warning', type: 'danger', route: '/complaints' }
  ]
})

const pendingItems = computed(() => {
  const items: any[] = []

  if (authStore.isEngineering) {
    complaintStore.complaints
      .filter(c => c.status === 'pending' || c.status === 'processing')
      .forEach(c => {
        items.push({
          type: '投诉', tagType: 'danger', name: c.title,
          status: c.status === 'pending' ? '待处理' : '处理中',
          statusKey: c.status, route: '/complaints/' + c.id
        })
      })
    return items.slice(0, 8)
  }

  tenantStore.tenants
    .filter(t => t.status === 'pending')
    .forEach(t => {
      items.push({
        type: '入驻', tagType: 'primary', name: t.name,
        status: '待审核', statusKey: 'pending', route: '/tenants/' + t.id
      })
    })

  if (authStore.isOperation || authStore.isAdmin) {
    licenseStore.licenses
      .filter(l => l.status === 'pending' || l.status === 'need_reupload')
      .forEach(l => {
        const statusLabel = l.status === 'need_reupload' ? '需补录' : '待审核'
        items.push({
          type: '证照', tagType: 'warning', name: l.license_type,
          status: statusLabel, statusKey: l.status, route: '/licenses/' + l.id
        })
      })
  }

  activityStore.activities
    .filter(a => a.status === 'pending')
    .forEach(a => {
      items.push({
        type: '活动', tagType: 'success', name: a.title,
        status: '待审核', statusKey: 'pending', route: '/activities/' + a.id
      })
    })

  complaintStore.complaints
    .filter(c => c.status === 'pending' || c.status === 'processing')
    .forEach(c => {
      items.push({
        type: '投诉', tagType: 'danger', name: c.title,
        status: c.status === 'pending' ? '待处理' : '处理中',
        statusKey: c.status, route: '/complaints/' + c.id
      })
    })

  return items.slice(0, 8)
})

const expiringLicenses = computed(() => {
  const threeMonthsLater = dayjs().add(3, 'month')
  return licenseStore.licenses
    .filter(l => {
      if (l.status === 'rejected') return false
      return dayjs(l.expire_date).isBefore(threeMonthsLater)
    })
    .map(l => ({
      ...l,
      tenant_name: tenantStore.tenants.find(t => t.id === l.tenant_id)?.name || '-'
    }))
    .slice(0, 5)
})
</script>

<style scoped lang="scss">
.stat-card {
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
  }
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.stat-tenants .stat-icon { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-pending .stat-icon { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
.stat-licenses .stat-icon { background: linear-gradient(135deg, #67c23a, #95d475); }
.stat-complaints .stat-icon { background: linear-gradient(135deg, #f56c6c, #fab6b6); }
.stat-activities .stat-icon { background: linear-gradient(135deg, #409eff, #66b1ff); }
.stat-processing .stat-icon { background: linear-gradient(135deg, #e6a23c, #f0c78a); }
.stat-resolved .stat-icon { background: linear-gradient(135deg, #67c23a, #95d475); }

.stat-info {
  .stat-value {
    font-size: 28px;
    font-weight: 700;
    color: #303133;
  }
  .stat-label {
    font-size: 13px;
    color: #909399;
    margin-top: 2px;
  }
}

.card-title {
  font-weight: 600;
  font-size: 15px;
}

.quick-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;

  .action-btn {
    min-width: 120px;
  }
}

.status-text {
  font-size: 12px;
  font-weight: 500;

  &.status-pending { color: #e6a23c; }
  &.status-processing { color: #409eff; }
  &.status-need_reupload { color: #f56c6c; }
}
</style>
