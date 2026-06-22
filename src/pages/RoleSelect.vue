<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ShieldCheck, Headphones, Wrench } from 'lucide-vue-next'
import type { GasRole } from '@/types/gas'

const router = useRouter()
const loading = ref<GasRole | null>(null)

const roles: Array<{
  key: GasRole
  name: string
  icon: any
  color: string
  description: string
  permissions: string[]
}> = [
  {
    key: 'safety_inspector',
    name: '安检员',
    icon: ShieldCheck,
    color: 'purple',
    description: '执行燃气安检、发现安全隐患、创建安检报告、验证隐患整改',
    permissions: ['燃气安检', '隐患发现', '安检报告', '整改验证'],
  },
  {
    key: 'customer_service',
    name: '客服',
    icon: Headphones,
    color: 'blue',
    description: '接收客户申请、创建停复气工单、回访客户、跟踪申请进度',
    permissions: ['申请受理', '工单创建', '客户回访', '进度跟踪'],
  },
  {
    key: 'repair_technician',
    name: '维修师傅',
    icon: Wrench,
    color: 'green',
    description: '执行停复气操作、处理隐患整改、更换燃气表、更新处理进度',
    permissions: ['停复气操作', '隐患整改', '换表作业', '进度更新'],
  },
]

const colorClasses: Record<string, { card: string; icon: string; button: string }> = {
  purple: {
    card: 'border-purple-200 hover:border-purple-400',
    icon: 'bg-purple-100 text-purple-600',
    button: 'bg-purple-600 hover:bg-purple-700',
  },
  blue: {
    card: 'border-blue-200 hover:border-blue-400',
    icon: 'bg-blue-100 text-blue-600',
    button: 'bg-blue-600 hover:bg-blue-700',
  },
  green: {
    card: 'border-green-200 hover:border-green-400',
    icon: 'bg-green-100 text-green-600',
    button: 'bg-green-600 hover:bg-green-700',
  },
}

async function handleSelect(role: GasRole) {
  loading.value = role
  try {
    const res = await fetch('/api/role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    })
    const data = await res.json()
    if (data.success) {
      router.push('/gas')
    }
  } catch (error) {
    console.error('角色切换失败:', error)
  } finally {
    loading.value = null
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-8">
    <div class="max-w-6xl w-full">
      <div class="text-center mb-12">
        <div class="inline-flex items-center gap-3 mb-4">
          <div class="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-xl">燃</span>
          </div>
          <h1 class="text-3xl font-bold text-white">燃气维保管理系统</h1>
        </div>
        <p class="text-slate-400 text-lg">停复气申请与客户回访 · 责任清晰 · 历史可追溯</p>
      </div>

      <div class="grid md:grid-cols-3 gap-6">
        <div
          v-for="role in roles"
          :key="role.key"
          class="bg-white rounded-2xl border-2 p-8 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
          :class="[
            colorClasses[role.color].card,
            loading === role.key ? 'opacity-70' : '',
          ]"
        >
          <div class="space-y-6">
            <div
              class="w-16 h-16 rounded-2xl flex items-center justify-center"
              :class="colorClasses[role.color].icon"
            >
              <component :is="role.icon" class="w-8 h-8" />
            </div>

            <div>
              <h3 class="text-xl font-bold text-slate-900 mb-2">{{ role.name }}</h3>
              <p class="text-slate-500 text-sm">{{ role.description }}</p>
            </div>

            <div class="space-y-2">
              <p class="text-xs font-medium text-slate-400 uppercase tracking-wider">核心权限</p>
              <ul class="space-y-1">
                <li
                  v-for="(perm, index) in role.permissions"
                  :key="index"
                  class="flex items-center gap-2 text-sm text-slate-600"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                  {{ perm }}
                </li>
              </ul>
            </div>

            <button
              @click="handleSelect(role.key)"
              :disabled="loading !== null"
              class="w-full py-3 px-6 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              :class="colorClasses[role.color].button"
            >
              {{ loading === role.key ? '进入中...' : '以此身份进入' }}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-12 text-center text-slate-500 text-sm">
        <p>提示：角色切换仅用于演示不同身份的工作视角，无真实权限控制</p>
      </div>
    </div>
  </div>
</template>
