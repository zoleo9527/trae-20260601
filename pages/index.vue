<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">📊 卡住看板</h2>
        <p class="text-gray-500 mt-1">实时暴露卡住的单子，不再事后才发现</p>
      </div>
      <button @click="loadData" class="btn-secondary text-sm">
        🔄 刷新
      </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <span class="text-2xl">📍</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-red-600">{{ stuckReport?.totalStuckSurveys || 0 }}</div>
            <div class="text-sm text-gray-500">勘察单卡住</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <span class="text-2xl">📋</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-600">{{ stuckReport?.totalStuckPlans || 0 }}</div>
            <div class="text-sm text-gray-500">方案单卡住</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <span class="text-2xl">⚠️</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-yellow-600">{{ stuckReport?.potentialStuckSurveys || 0 }}</div>
            <div class="text-sm text-gray-500">勘察可能卡住</div>
          </div>
        </div>
      </div>
      <div class="card">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center">
            <span class="text-2xl">⚠️</span>
          </div>
          <div>
            <div class="text-2xl font-bold text-amber-600">{{ stuckReport?.potentialStuckPlans || 0 }}</div>
            <div class="text-sm text-gray-500">方案可能卡住</div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="stuckReport?.stuckSurveys?.length" class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">📍 卡住的点位勘察单</h3>
        <span class="status-badge bg-red-100 text-red-700">
          {{ stuckReport.stuckSurveys.length }} 单
        </span>
      </div>
      <div class="space-y-3">
        <div 
          v-for="item in stuckReport.stuckSurveys" 
          :key="item.id"
          class="flex items-center justify-between p-4 bg-red-50 border border-red-100 rounded-xl hover:bg-red-100 transition-colors cursor-pointer"
          @click="navigateTo(`/surveys/${item.id}`)"
        >
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <span class="font-medium text-gray-900">{{ item.projectName }}</span>
              <span class="text-xs text-gray-500">{{ item.projectCode }}</span>
            </div>
            <div class="text-sm text-red-600 mt-1">
              🔴 {{ item.stuckReason }}
            </div>
            <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>处理人: {{ item.assignedToName }}</span>
              <span>已卡住 {{ item.stuckHours }} 小时</span>
              <span>卡住时间: {{ formatDate(item.stuckAt) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span :class="['status-badge', getStatusColor(item.status)]">
              {{ getStatusText(item.status) }}
            </span>
            <span class="text-gray-400">→</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="stuckReport?.stuckPlans?.length" class="card">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">📋 卡住的方案确认单</h3>
        <span class="status-badge bg-orange-100 text-orange-700">
          {{ stuckReport.stuckPlans.length }} 单
        </span>
      </div>
      <div class="space-y-3">
        <div 
          v-for="item in stuckReport.stuckPlans" 
          :key="item.id"
          class="flex items-center justify-between p-4 bg-orange-50 border border-orange-100 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer"
          @click="navigateTo(`/plans/${item.id}`)"
        >
          <div class="flex-1">
            <div class="flex items-center gap-3">
              <span class="font-medium text-gray-900">{{ item.projectName }}</span>
              <span class="text-xs text-gray-500">{{ item.projectCode }}</span>
            </div>
            <div class="text-sm text-orange-600 mt-1">
              🟠 {{ item.stuckReason }}
            </div>
            <div class="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span>处理人: {{ item.assignedToName }}</span>
              <span>已卡住 {{ item.stuckHours }} 小时</span>
              <span>卡住时间: {{ formatDate(item.stuckAt) }}</span>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <span :class="['status-badge', getStatusColor(item.status)]">
              {{ getStatusText(item.status) }}
            </span>
            <span class="text-gray-400">→</span>
          </div>
        </div>
      </div>
    </div>

    <div v-if="!stuckReport?.stuckSurveys?.length && !stuckReport?.stuckPlans?.length" class="card text-center py-12">
      <div class="text-5xl mb-4">🎉</div>
      <h3 class="text-xl font-semibold text-gray-900">太棒了！当前没有卡住的单子</h3>
      <p class="text-gray-500 mt-2">所有项目都在正常推进中</p>
    </div>
  </div>
</template>

<script setup lang="ts">
const authStore = useAuthStore()
const stuckReport = ref<any>(null)

watch(() => authStore.isLoggedIn, (loggedIn) => {
  if (loggedIn) {
    loadData()
  } else {
    navigateTo('/login')
  }
}, { immediate: true })

async function loadData() {
  if (!authStore.isLoggedIn) return
  try {
    stuckReport.value = await apiRequest('/plans/stuck')
  } catch (e: any) {
    console.error('加载卡住看板失败:', e)
  }
}
</script>
