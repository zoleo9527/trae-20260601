<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { User, HardHat, Wrench } from 'lucide-vue-next'
import type { Role } from '@/types'
import { useRole } from '@/stores/role'

const router = useRouter()
const { setRole } = useRole()
const loading = ref<Role | null>(null)

const roles = [
  {
    key: 'pm' as Role,
    name: '项目经理',
    icon: User,
    color: 'purple',
    description: '查看全部联调和问题、审批测试结果、指派整改责任人、导出交班报告',
    permissions: ['全局数据查看', '测试结果审批', '整改责任指派', '交班报告导出'],
  },
  {
    key: 'captain' as Role,
    name: '施工队长',
    icon: HardHat,
    color: 'blue',
    description: '创建和执行联调测试、提交测试结果、从失败测试一键创建问题整改单',
    permissions: ['创建联调测试', '执行测试项', '提交测试结果', '一键转问题整改'],
  },
  {
    key: 'engineer' as Role,
    name: '售后工程师',
    icon: Wrench,
    color: 'green',
    description: '接收整改指派、更新整改进度、提交整改完成、标记验证通过',
    permissions: ['接收整改任务', '更新整改进度', '提交整改完成', '参与验证'],
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

async function handleSelect(role: Role) {
  loading.value = role
  try {
    await setRole(role)
    router.push('/dashboard')
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
          <div class="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
            <span class="text-white font-bold text-xl">安</span>
          </div>
          <h1 class="text-3xl font-bold text-white">安防工程商联调系统</h1>
        </div>
        <p class="text-slate-400 text-lg">联调测试与问题整改管理 · 责任清晰 · 历史可追溯</p>
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
