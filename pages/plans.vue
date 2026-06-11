<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">📋 方案确认</h2>
        <p class="text-gray-500 mt-1">管理方案确认单的创建、提交和客户确认</p>
      </div>
      <div class="flex gap-3">
        <button @click="activeTab = 'all'" :class="activeTab === 'all' ? 'btn-primary' : 'btn-secondary'" class="text-sm">
          全部
        </button>
        <button @click="activeTab = 'my'" :class="activeTab === 'my' ? 'btn-primary' : 'btn-secondary'" class="text-sm">
          我的
        </button>
      </div>
    </div>

    <div class="card">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead>
            <tr class="border-b border-gray-200">
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">项目编号</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">项目名称</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">预算</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">工期</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">状态</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">处理人</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">更新时间</th>
              <th class="text-left py-3 px-4 text-sm font-medium text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr 
              v-for="plan in plans" 
              :key="plan.id" 
              class="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              :class="plan.stuck ? 'bg-orange-50' : ''"
            >
              <td class="py-4 px-4 text-sm font-mono text-gray-600">{{ plan.projectCode }}</td>
              <td class="py-4 px-4">
                <div class="font-medium text-gray-900">{{ plan.projectName }}</div>
                <div v-if="plan.stuck" class="text-xs text-orange-600 mt-1">
                  🟠 {{ plan.stuckReason }}
                </div>
              </td>
              <td class="py-4 px-4 text-sm text-gray-600">¥{{ formatMoney(plan.estimatedCost) }}</td>
              <td class="py-4 px-4 text-sm text-gray-600">{{ plan.constructionDays }} 天</td>
              <td class="py-4 px-4">
                <span :class="['status-badge', getStatusColor(plan.status)]">
                  {{ getStatusText(plan.status) }}
                </span>
              </td>
              <td class="py-4 px-4 text-sm text-gray-600">
                {{ plan.assignedTo?.realName || '-' }}
              </td>
              <td class="py-4 px-4 text-sm text-gray-500">{{ formatDate(plan.updatedAt) }}</td>
              <td class="py-4 px-4">
                <button 
                  @click="navigateTo(`/plans/${plan.id}`)" 
                  class="text-primary-600 hover:text-primary-700 text-sm font-medium"
                >
                  查看详情 →
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const plans = ref<any[]>([])
const activeTab = ref('all')

watch([() => authStore.isLoggedIn, activeTab], () => {
  if (authStore.isLoggedIn) {
    loadPlans()
  } else {
    navigateTo('/login')
  }
}, { immediate: true })

async function loadPlans() {
  if (!authStore.isLoggedIn) return
  const url = activeTab.value === 'my' ? '/plans/my' : '/plans'
  plans.value = await apiRequest(url)
}

function formatMoney(amount: number): string {
  return amount?.toLocaleString('zh-CN') || '-'
}
</script>
