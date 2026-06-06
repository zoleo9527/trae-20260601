<template>
  <div class="p-6 space-y-6">
    <h1 class="text-2xl font-bold text-gray-900">数据管理</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">角色切换</h2>
        <p class="text-sm text-gray-500 mb-4">选择当前用户角色，不同角色有不同的操作权限</p>
        <div class="space-y-3">
          <div
            v-for="user in appStore.userList"
            :key="user.id"
            class="flex items-center justify-between p-4 rounded-lg border cursor-pointer transition-colors"
            :class="appStore.currentRole === user.role ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'"
            @click="switchRole(user.role)"
          >
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                <User class="w-5 h-5 text-gray-500" />
              </div>
              <div>
                <p class="font-medium text-gray-900">{{ user.name }}</p>
                <p class="text-sm text-gray-500">{{ getRoleText(user.role) }}</p>
              </div>
            </div>
            <div
              v-if="appStore.currentRole === user.role"
              class="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center"
            >
              <Check class="w-4 h-4 text-white" />
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">数据重置</h2>
        <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <div class="flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p class="text-sm font-medium text-red-800">警告</p>
              <p class="text-sm text-red-600 mt-1">
                此操作将重置所有数据，包括订单、报关资料、库存等。重置后数据将无法恢复，请谨慎操作。
              </p>
            </div>
          </div>
        </div>
        <button
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          @click="handleResetData"
        >
          <RotateCcw class="w-4 h-4" />
          重置所有数据
        </button>
      </div>

      <div class="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-6">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">系统信息</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p class="text-sm text-gray-500">当前用户</p>
            <p class="text-base font-medium text-gray-900 mt-1">{{ appStore.currentUser.name }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">当前角色</p>
            <p class="text-base font-medium text-gray-900 mt-1">{{ getRoleText(appStore.currentRole) }}</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">系统版本</p>
            <p class="text-base font-medium text-gray-900 mt-1">v1.0.0</p>
          </div>
          <div>
            <p class="text-sm text-gray-500">最后更新</p>
            <p class="text-base font-medium text-gray-900 mt-1">{{ formatDate(new Date().toISOString()) }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User, Check, AlertTriangle, RotateCcw } from 'lucide-vue-next'
import { useAppStore } from '~/stores/app'
import { useFormat } from '~/composables/useFormat'
import type { UserRole } from '~/types'

const appStore = useAppStore()
const { getRoleText, formatDate } = useFormat()

const switchRole = (role: UserRole) => {
  appStore.setRole(role)
}

const handleResetData = async () => {
  if (!confirm('确定要重置所有数据吗？此操作不可恢复！')) return
  if (!confirm('再次确认：真的要重置所有数据吗？')) return

  try {
    await $fetch('/api/data/reset', { method: 'POST' })
    alert('数据重置成功！')
    window.location.reload()
  } catch (error) {
    alert('数据重置失败，请重试')
  }
}
</script>
