<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 flex items-center justify-center p-4">
    <div class="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8">
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <TicketIcon class="w-8 h-8 text-white" />
        </div>
        <h1 class="text-2xl font-bold text-gray-900">景区票务管理系统</h1>
        <p class="text-gray-500 mt-2">选择演示账号登录</p>
      </div>

      <div class="space-y-4">
        <button
          v-for="user in demoUsers"
          :key="user.id"
          @click="handleLogin(user)"
          class="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors group"
        >
          <div class="flex items-center space-x-4">
            <div :class="getRoleBgClass(user.role)" class="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
              <UserIcon v-if="user.role === 'ticket_manager'" class="w-6 h-6 text-white" />
              <BuildingOffice2Icon v-else-if="user.role === 'gate_staff'" class="w-6 h-6 text-white" />
              <ChatBubbleLeftIcon v-else class="w-6 h-6 text-white" />
            </div>
            <div class="text-left flex-1">
              <div class="font-semibold text-gray-900">{{ user.name }}</div>
              <div class="text-sm text-gray-500">{{ getRoleLabel(user.role) }} · {{ user.department }}</div>
            </div>
            <ChevronRightIcon class="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
          </div>
        </button>
      </div>

      <div class="mt-8 p-4 bg-blue-50 rounded-xl">
        <div class="flex items-start space-x-3">
          <InformationCircleIcon class="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div class="text-sm text-blue-800">
            <div class="font-medium mb-1">系统功能说明</div>
            <ul class="space-y-1 text-blue-700">
              <li>• 退票申请：处理游客退票请求，查看退款进度</li>
              <li>• 改期申请：处理游客日期变更请求</li>
              <li>• 投诉处理：查看和处理游客投诉</li>
              <li>• 异常记录：管理系统异常和设备故障</li>
            </ul>
          </div>
        </div>
      </div>

      <div class="mt-6 text-center text-sm text-gray-500">
        <p>所有数据均为模拟数据，仅供演示使用</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  TicketIcon,
  UserIcon,
  BuildingOffice2Icon,
  ChatBubbleLeftIcon,
  ChevronRightIcon,
  InformationCircleIcon
} from '@heroicons/vue/24/outline'
import type { User } from '~/types'

const demoUsers: User[] = [
  { id: 'u1', name: '张明', role: 'ticket_manager', department: '票务部' },
  { id: 'u2', name: '李华', role: 'gate_staff', department: '检票部' },
  { id: 'u3', name: '王芳', role: 'customer_service', department: '客服部' }
]

function getRoleBgClass(role: string) {
  const classMap: Record<string, string> = {
    ticket_manager: 'bg-blue-600',
    gate_staff: 'bg-green-600',
    customer_service: 'bg-purple-600'
  }
  return classMap[role] || 'bg-gray-600'
}

function getRoleLabel(role: string) {
  const labelMap: Record<string, string> = {
    ticket_manager: '票务主管',
    gate_staff: '检票员',
    customer_service: '客服'
  }
  return labelMap[role] || role
}

function handleLogin(user: User) {
  sessionStorage.setItem('currentUser', JSON.stringify(user))
  window.location.href = '/'
}
</script>