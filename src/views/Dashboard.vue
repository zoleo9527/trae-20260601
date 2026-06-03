<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import dayjs from 'dayjs'

const props = defineProps<{ userRole: 'reception' | 'admin' }>()

const stats = ref<any>(null)
const recentFailed = ref<any[]>([])
const loading = ref(true)

const loadData = async () => {
  loading.value = true
  try {
    const [statsData, failedData] = await Promise.all([
      window.api.accessEvent.getStats(),
      window.api.accessEvent.getRecentFailed()
    ])
    stats.value = statsData
    recentFailed.value = failedData
  } finally {
    loading.value = false
  }
}

onMounted(loadData)

const getTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    owner: '业主', tenant: '租客', family: '家属'
  }
  return map[type] || type
}

const getStatusBadge = (status: string) => {
  const map: Record<string, string> = {
    active: 'badge-active', inactive: 'badge-inactive',
    lost: 'badge-lost', expired: 'badge-expired', pending: 'badge-pending'
  }
  return map[status] || ''
}

const getStatusLabel = (status: string) => {
  const map: Record<string, string> = {
    active: '正常', inactive: '停用',
    lost: '已挂失', expired: '已过期', pending: '待激活'
  }
  return map[status] || status
}

const statCards = computed(() => [
  { icon: '💳', label: '卡片总数', value: stats.value?.totalCards || 0, color: 'blue' },
  { icon: '✅', label: '正常使用', value: stats.value?.activeCards || 0, color: 'green' },
  { icon: '⚠️', label: '已挂失', value: stats.value?.lostCards || 0, color: 'orange' },
  { icon: '⏰', label: '已过期', value: stats.value?.expiredCards || 0, color: 'red' },
  { icon: '👥', label: '住户总数', value: stats.value?.totalResidents || 0, color: 'blue' },
  { icon: '📋', label: '待审核', value: stats.value?.pendingApps || 0, color: 'orange' },
  { icon: '📅', label: '今日事件', value: stats.value?.todayEvents || 0, color: 'green' },
  { icon: '❌', label: '今日失败', value: stats.value?.todayFailed || 0, color: 'red' }
])
</script>

<template>
  <div v-if="loading" class="empty">加载中...</div>
  <div v-else>
    <div class="grid grid-cols-4 gap-4 mb-4">
      <div v-for="(stat, idx) in statCards" :key="idx" class="stat-card">
        <div class="stat-icon" :class="stat.color">{{ stat.icon }}</div>
        <div class="stat-content">
          <div class="value">{{ stat.value }}</div>
          <div class="label">{{ stat.label }}</div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-2 gap-4">
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">⚠️ 异常门禁事件</h3>
          <button class="btn btn-sm" @click="loadData">刷新</button>
        </div>
        <div class="card-body" style="padding: 0;">
          <div v-if="recentFailed.length === 0" class="empty">暂无异常事件</div>
          <div v-else class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>卡号</th>
                  <th>持卡人</th>
                  <th>卡状态</th>
                  <th>门禁点</th>
                  <th>失败原因</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="event in recentFailed" :key="event.id">
                  <td class="text-sm text-gray">
                    {{ dayjs(event.eventTime).format('MM-DD HH:mm:ss') }}
                  </td>
                  <td class="font-mono">{{ event.cardNo }}</td>
                  <td>{{ event.residentName || '未知' }}</td>
                  <td>
                    <span v-if="event.cardStatus" class="badge" :class="getStatusBadge(event.cardStatus)">
                      {{ getStatusLabel(event.cardStatus) }}
                    </span>
                    <span v-else class="text-gray">-</span>
                  </td>
                  <td>{{ event.doorName }}</td>
                  <td class="text-danger">{{ event.reason }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">📖 系统说明</h3>
        </div>
        <div class="card-body">
          <div class="alert alert-danger mb-3">
            <div>
              <strong>🔴 挂失卡尝试使用</strong>
              <p class="text-sm mt-2">
                CARD000003（张伟的车库卡）已于2025年12月挂失，但昨日（6月1日）被两次尝试在车库入口使用。
                请联系业主确认是否为卡片找回或需要报警处理。
              </p>
            </div>
          </div>
          <div class="alert alert-warning mb-3">
            <div>
              <strong>🟡 租客到期提醒</strong>
              <p class="text-sm mt-2">
                李小明（2-2-802）租约将于2026年2月28日到期，其门禁卡也将同步失效。
                请提前联系业主确认是否续约。
              </p>
            </div>
          </div>
          <div class="alert alert-warning mb-3">
            <div>
              <strong>🟡 车库权限争议</strong>
              <p class="text-sm mt-2">
                业主张伟（1-1-1501）申请将权限从"含车库权限"升级为"VIP全权限"，
                原因是"需经常使用设备层和天台"。需管理员审核。
              </p>
            </div>
          </div>
          <div class="alert alert-info">
            <div>
              <strong>🔵 多张卡说明</strong>
              <p class="text-sm mt-2">
                业主张伟名下有3张卡：2张正常使用（主卡+家人副卡），1张已挂失的车库卡。
                支持一户多卡管理。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.grid {
  display: grid;
}
.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}
.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}
.gap-4 {
  gap: 16px;
}
.mb-4 {
  margin-bottom: 16px;
}
.font-mono {
  font-family: 'SF Mono', Monaco, monospace;
}
</style>
