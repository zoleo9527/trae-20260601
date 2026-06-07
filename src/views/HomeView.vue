<template>
  <div class="space-y-6">
    <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-6 text-white">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">加油站运营工作台</h1>
          <p class="text-blue-100 mt-1">
            当前用户: <span class="font-medium">{{ store.currentUser.name }}</span>
            <span class="ml-2 bg-white/20 px-2 py-0.5 rounded text-sm">
              {{ store.roleLabel(store.currentUser.role) }}
            </span>
          </p>
        </div>
        <div class="text-right">
          <p class="text-blue-100 text-sm">{{ formatDate(new Date().toISOString()) }}</p>
          <p class="text-3xl font-bold mt-1">{{ formatTime(new Date()) }}</p>
        </div>
      </div>
    </div>

    <div v-if="store.myPendingInspections.length > 0 || store.myPendingRepairs.length > 0" class="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-4">
      <div class="flex items-start">
        <span class="text-yellow-400 text-xl mr-3">⚠️</span>
        <div class="flex-1">
          <h3 class="font-medium text-yellow-800">待办事项提醒</h3>
          <div class="mt-2 space-y-1">
            <p v-if="store.myPendingInspections.length > 0" class="text-sm text-yellow-700">
              • 有 {{ store.myPendingInspections.length }} 个巡检任务等待您处理
            </p>
            <p v-if="store.myPendingRepairs.length > 0" class="text-sm text-yellow-700">
              • 有 {{ store.myPendingRepairs.length }} 个报修工单等待您处理
            </p>
          </div>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理巡检</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ store.myPendingInspections.length }}</p>
          </div>
          <div class="text-4xl">📋</div>
        </div>
        <router-link to="/inspections?status=pending" class="text-sm text-blue-600 hover:underline mt-3 inline-block">
          查看详情 →
        </router-link>
      </div>

      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">待处理报修</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ store.myPendingRepairs.length }}</p>
          </div>
          <div class="text-4xl">🔧</div>
        </div>
        <router-link to="/repairs?status=submitted" class="text-sm text-orange-600 hover:underline mt-3 inline-block">
          查看详情 →
        </router-link>
      </div>

      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">本周已完成</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ completedThisWeek }}</p>
          </div>
          <div class="text-4xl">✅</div>
        </div>
        <p class="text-sm text-gray-500 mt-3">巡检 + 报修</p>
      </div>

      <div class="bg-white rounded-lg shadow p-5 border-l-4 border-purple-500">
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm text-gray-500">处理率</p>
            <p class="text-3xl font-bold text-gray-900 mt-1">{{ processRate }}%</p>
          </div>
          <div class="text-4xl">📊</div>
        </div>
        <p class="text-sm text-gray-500 mt-3">近7天数据</p>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 space-y-6">
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">📋 我的待办 - 巡检</h3>
            <router-link to="/inspections" class="text-sm text-blue-600 hover:underline">全部巡检</router-link>
          </div>
          <div class="divide-y max-h-80 overflow-y-auto">
            <div 
              v-for="inspection in store.myPendingInspections.slice(0, 5)" 
              :key="inspection.id"
              class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="router.push(`/inspections/${inspection.id}`)"
            >
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium text-gray-900">{{ inspection.deviceName }}</p>
                  <p class="text-sm text-gray-500 mt-0.5">{{ inspection.location }} · {{ inspection.inspectionNo }}</p>
                </div>
                <StatusBadge type="inspection" :status="inspection.status" />
              </div>
            </div>
            <div v-if="store.myPendingInspections.length === 0" class="px-6 py-12 text-center text-gray-400">
              <span class="text-4xl mb-2 block">🎉</span>
              暂无待处理巡检
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b flex items-center justify-between">
            <h3 class="font-semibold text-gray-900">🔧 我的待办 - 报修</h3>
            <router-link to="/repairs" class="text-sm text-blue-600 hover:underline">全部报修</router-link>
          </div>
          <div class="divide-y max-h-80 overflow-y-auto">
            <div 
              v-for="repair in store.myPendingRepairs.slice(0, 5)" 
              :key="repair.id"
              class="px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
              @click="router.push(`/repairs/${repair.id}`)"
            >
              <div class="flex items-center justify-between">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center space-x-2">
                    <p class="font-medium text-gray-900 truncate">{{ repair.deviceName }}</p>
                    <PriorityBadge :priority="repair.priority" />
                  </div>
                  <p class="text-sm text-gray-500 mt-0.5">{{ repair.repairNo }} · 上报人: {{ repair.reporterName }}</p>
                </div>
                <StatusBadge type="repair" :status="repair.status" />
              </div>
            </div>
            <div v-if="store.myPendingRepairs.length === 0" class="px-6 py-12 text-center text-gray-400">
              <span class="text-4xl mb-2 block">🎉</span>
              暂无待处理报修
            </div>
          </div>
        </div>
      </div>

      <div class="space-y-6">
        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h3 class="font-semibold text-gray-900">👥 角色处理节奏</h3>
          </div>
          <div class="p-4 space-y-4">
            <div v-for="role in roleStats" :key="role.role" class="flex items-center space-x-3">
              <span class="text-2xl">{{ role.avatar }}</span>
              <div class="flex-1">
                <div class="flex items-center justify-between">
                  <span class="text-sm font-medium text-gray-700">{{ role.label }}</span>
                  <span class="text-xs text-gray-500">{{ role.count }} 项待办</span>
                </div>
                <div class="mt-1 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    class="h-2 rounded-full transition-all"
                    :class="role.color"
                    :style="{ width: `${role.percent}%` }"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-lg shadow">
          <div class="px-6 py-4 border-b">
            <h3 class="font-semibold text-gray-900">📝 最近动态</h3>
          </div>
          <div class="divide-y max-h-96 overflow-y-auto">
            <div v-for="(log, idx) in recentActivities.slice(0, 10)" :key="idx" class="px-4 py-3">
              <div class="flex items-start space-x-3">
                <span class="text-lg">{{ getRoleAvatar(log.userRole) }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm text-gray-900">
                    <span class="font-medium">{{ log.userName }}</span>
                  </p>
                  <p class="text-sm text-gray-600 mt-0.5">{{ log.remark }}</p>
                  <p class="text-xs text-gray-400 mt-1">{{ formatDateTime(log.timestamp) }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useGasStationStore } from '@/stores/gasStation'
import type { UserRole } from '@/types'
import StatusBadge from '@/components/StatusBadge.vue'
import PriorityBadge from '@/components/PriorityBadge.vue'

const store = useGasStationStore()
const router = useRouter()

const completedThisWeek = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const inspCompleted = store.inspections.filter(i => 
    i.status === 'completed' && new Date(i.updatedAt) > weekAgo
  ).length
  const repairCompleted = store.repairs.filter(r => 
    ['completed', 'verified', 'closed'].includes(r.status) && new Date(r.updatedAt) > weekAgo
  ).length
  return inspCompleted + repairCompleted
})

const processRate = computed(() => {
  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const total = store.inspections.filter(i => new Date(i.createdAt) > weekAgo).length +
                store.repairs.filter(r => new Date(r.createdAt) > weekAgo).length
  if (total === 0) return 100
  return Math.round((completedThisWeek.value / total) * 100)
})

const roleStats = computed(() => {
  const roles: { role: UserRole; label: string; avatar: string; color: string; count: number; percent: number }[] = [
    { role: 'station_master', label: '站长', avatar: '👨‍💼', color: 'bg-blue-500', count: 0, percent: 0 },
    { role: 'cashier', label: '收银员', avatar: '👩‍💻', color: 'bg-green-500', count: 0, percent: 0 },
    { role: 'gauge_officer', label: '计量员', avatar: '👨‍🔧', color: 'bg-orange-500', count: 0, percent: 0 }
  ]
  
  let maxCount = 1
  
  roles.forEach(r => {
    if (r.role === 'station_master') {
      r.count = store.repairs.filter(x => ['submitted', 'completed'].includes(x.status)).length +
                 store.inspections.filter(x => x.status === 'abnormal').length
    } else if (r.role === 'gauge_officer') {
      r.count = store.inspections.filter(x => x.inspectorId === 'u3' && ['pending', 'recheck'].includes(x.status)).length +
                 store.repairs.filter(x => x.assigneeId === 'u3' && ['assigned', 'in_progress', 'waiting_parts'].includes(x.status)).length
    } else if (r.role === 'cashier') {
      r.count = store.repairs.filter(x => x.reporterId === 'u2' && x.status === 'completed').length
    }
    if (r.count > maxCount) maxCount = r.count
  })
  
  roles.forEach(r => {
    r.percent = Math.round((r.count / maxCount) * 100)
  })
  
  return roles
})

const recentActivities = computed(() => {
  const allLogs: any[] = []
  store.inspections.forEach(i => {
    i.statusLogs.forEach(log => allLogs.push({ ...log, type: 'inspection' }))
  })
  store.repairs.forEach(r => {
    r.statusLogs.forEach(log => allLogs.push({ ...log, type: 'repair' }))
  })
  return allLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
})

const getRoleAvatar = (role: UserRole) => {
  const map: Record<UserRole, string> = {
    station_master: '👨‍💼',
    cashier: '👩‍💻',
    gauge_officer: '👨‍🔧'
  }
  return map[role] || '👤'
}

const formatDateTime = (iso: string) => {
  const d = new Date(iso)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatTime = (d: Date) => {
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

const formatDate = (iso: string) => {
  const d = new Date(iso)
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
}
</script>
