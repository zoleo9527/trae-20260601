<script setup lang="ts">
import { FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-vue-next'

const authStore = useAuthStore()
const caseStore = useCaseStore()

const currentUser = computed(() => authStore.currentUser)

onMounted(async () => {
  if (!currentUser.value) {
    authStore.switchRole('CLAIM_AGENT')
  }
  await caseStore.fetchCases()
})

const pendingCases = computed(() => {
  return caseStore.cases.filter(c => 
    c.status === 'PENDING_SUBMIT' || c.status === 'REJECTED' || c.status === 'REVIEW_FAILED'
  )
})

const submittedCases = computed(() => {
  return caseStore.cases.filter(c => c.status === 'SUBMITTED')
})

const pendingReviewCases = computed(() => {
  return caseStore.cases.filter(c => c.status === 'PENDING_REVIEW')
})

const completedCases = computed(() => {
  return caseStore.cases.filter(c => c.status === 'COMPLETED')
})

const stats = computed(() => [
  {
    label: '待处理',
    value: pendingCases.value.length,
    icon: Clock,
    color: 'var(--color-warning)'
  },
  {
    label: '待核赔',
    value: pendingReviewCases.value.length,
    icon: FileText,
    color: 'var(--color-info)'
  },
  {
    label: '已完成',
    value: completedCases.value.length,
    icon: CheckCircle,
    color: 'var(--color-success)'
  }
])
</script>

<template>
  <div class="page-container">
    <div class="page-header">
      <div class="flex flex-between flex-center">
        <div>
          <h1 class="page-title">保险理赔中心</h1>
          <p class="page-subtitle">报案受理与材料清单管理系统</p>
        </div>
        <div class="role-switcher">
          <span class="role-switcher-label">当前角色：</span>
          <select 
            :value="currentUser?.role" 
            @change="authStore.switchRole(($event.target as HTMLSelectElement).value as any)"
            class="input role-select"
          >
            <option value="CLAIM_AGENT">理赔专员</option>
            <option value="SURVEYOR">查勘员</option>
            <option value="UNDERWRITER">核赔主管</option>
          </select>
          <span v-if="currentUser" class="user-name">{{ currentUser.name }}</span>
        </div>
      </div>
    </div>

    <div class="stats-grid mb-lg">
      <div v-for="stat in stats" :key="stat.label" class="stat-card card">
        <div class="stat-icon" :style="{ color: stat.color }">
          <component :is="stat.icon" :size="32" />
        </div>
        <div class="stat-value">{{ stat.value }}</div>
        <div class="stat-label">{{ stat.label }}</div>
      </div>
    </div>

    <div class="grid grid-2 gap-lg">
      <div class="card">
        <div class="flex flex-between flex-center mb-md">
          <h2 class="section-title">待处理任务</h2>
          <NuxtLink to="/cases" class="btn btn-secondary">查看全部</NuxtLink>
        </div>
        <div v-if="pendingCases.length === 0" class="empty-state">
          <Clock :size="48" class="empty-icon" />
          <p>暂无待处理任务</p>
        </div>
        <div v-else class="task-list">
          <NuxtLink 
            v-for="item in pendingCases.slice(0, 5)" 
            :key="item.id" 
            :to="`/cases/${item.id}`"
            class="task-item"
          >
            <div class="task-info">
              <div class="task-no">{{ item.reportNo }}</div>
              <div class="task-holder">{{ item.policyHolder }}</div>
            </div>
            <CommonStatusBadge :status="item.status" />
          </NuxtLink>
        </div>
      </div>

      <div class="card">
        <div class="flex flex-between flex-center mb-md">
          <h2 class="section-title">快速操作</h2>
        </div>
        <div class="quick-actions">
          <NuxtLink 
            v-if="currentUser?.role === 'CLAIM_AGENT'" 
            to="/cases/new"
            class="quick-action"
          >
            <FileText :size="24" />
            <span>新建报案</span>
          </NuxtLink>
          <NuxtLink 
            v-if="currentUser?.role === 'SURVEYOR'" 
            to="/cases"
            class="quick-action"
          >
            <CheckCircle :size="24" />
            <span>审核材料</span>
          </NuxtLink>
          <NuxtLink 
            v-if="currentUser?.role === 'UNDERWRITER'" 
            to="/cases"
            class="quick-action"
          >
            <FileText :size="24" />
            <span>审批案件</span>
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.role-switcher {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
}

.role-switcher-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
}

.role-select {
  width: auto;
  padding: var(--spacing-sm) var(--spacing-md);
}

.user-name {
  font-weight: 600;
  color: var(--color-primary);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-lg);
}

.stat-card {
  text-align: center;
  padding: var(--spacing-xl);
}

.stat-icon {
  margin-bottom: var(--spacing-md);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  color: var(--color-text);
  line-height: 1;
}

.stat-label {
  font-size: 0.875rem;
  color: var(--color-text-secondary);
  margin-top: var(--spacing-sm);
}

.section-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
}

.empty-state {
  text-align: center;
  padding: var(--spacing-xl);
  color: var(--color-text-secondary);
}

.empty-icon {
  margin-bottom: var(--spacing-md);
  opacity: 0.5;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  text-decoration: none;
  transition: all 0.2s;
}

.task-item:hover {
  background: var(--color-border);
}

.task-no {
  font-weight: 600;
  color: var(--color-text);
  font-size: 0.875rem;
}

.task-holder {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
  margin-top: 0.25rem;
}

.quick-actions {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.quick-action {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  text-decoration: none;
  color: var(--color-text);
  font-weight: 500;
  transition: all 0.2s;
}

.quick-action:hover {
  background: var(--color-primary);
  color: white;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .role-switcher {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
